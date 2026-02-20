import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, setConfig, isConfigured } from './config.js';
import {
  searchAirports,
  findCitiesFromLatLong,
  findCitiesFromText,
  getSignificantCities,
  getContinents,
  getCountries,
  getElevation,
  getDistance,
  getSunPositions,
  getTimezone,
  ping
} from './api.js';

const program = new Command();

// ============================================================
// Helpers
// ============================================================

function printSuccess(message) {
  console.log(chalk.green('✓') + ' ' + message);
}

function printError(message) {
  console.error(chalk.red('✗') + ' ' + message);
}

function printTable(data, columns) {
  if (!data || data.length === 0) {
    console.log(chalk.yellow('No results found.'));
    return;
  }

  const widths = {};
  columns.forEach(col => {
    widths[col.key] = col.label.length;
    data.forEach(row => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      if (val.length > widths[col.key]) widths[col.key] = val.length;
    });
    widths[col.key] = Math.min(widths[col.key], 50);
  });

  const header = columns.map(col => col.label.padEnd(widths[col.key])).join('  ');
  console.log(chalk.bold(chalk.cyan(header)));
  console.log(chalk.dim('─'.repeat(header.length)));

  data.forEach(row => {
    const line = columns.map(col => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      return val.substring(0, widths[col.key]).padEnd(widths[col.key]);
    }).join('  ');
    console.log(line);
  });

  console.log(chalk.dim(`\n${data.length} result(s)`));
}

function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

async function withSpinner(message, fn) {
  const spinner = ora(message).start();
  try {
    const result = await fn();
    spinner.stop();
    return result;
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

function requireAuth() {
  if (!isConfigured()) {
    printError('API key not configured.');
    console.log('\nRun the following to configure:');
    console.log(chalk.cyan('  monvoyagepascher config set --api-key YOUR_API_KEY'));
    console.log('\nGet an API key at: https://mon-voyage-pas-cher.com/');
    process.exit(1);
  }
}

// ============================================================
// Program metadata
// ============================================================

program
  .name('monvoyagepascher')
  .description(chalk.bold('Mon Voyage Pas Cher CLI') + ' - Travel and flight deals from your terminal')
  .version('1.0.0');

// ============================================================
// CONFIG
// ============================================================

const configCmd = program.command('config').description('Manage CLI configuration');

configCmd
  .command('set')
  .description('Set configuration values')
  .option('--api-key <key>', 'Mon-voyage-pas-cher.com API key')
  .option('--language <lang>', 'Default language (en, fr, de, es)')
  .action((options) => {
    if (options.apiKey) {
      setConfig('apiKey', options.apiKey);
      printSuccess('API key set');
    }
    if (options.language) {
      setConfig('language', options.language);
      printSuccess(`Language set to ${options.language}`);
    }
    if (!options.apiKey && !options.language) {
      printError('No options provided. Use --api-key or --language');
    }
  });

configCmd
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const apiKey = getConfig('apiKey');
    const language = getConfig('language');
    console.log(chalk.bold('\nMon Voyage Pas Cher CLI Configuration\n'));
    console.log('API Key:  ', apiKey ? chalk.green(apiKey.substring(0, 6) + '...' + apiKey.slice(-4)) : chalk.red('not set'));
    console.log('Language: ', chalk.cyan(language || 'en'));
    console.log('');
  });

// ============================================================
// AIRPORTS
// ============================================================

program
  .command('airports')
  .description('Search airports by location, country, or IATA code')
  .option('--location <coords>', 'Coordinates (lat,long)')
  .option('--radius <km>', 'Search radius in km (max 500)')
  .option('--country <code>', 'Country code (e.g., US, FR, GB)')
  .option('--top', 'Filter to top airports only')
  .option('--language <lang>', 'Language (en, fr, de, es)')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();

    try {
      const opts = {
        language: options.language,
        location: options.location,
        radius: options.radius,
        countrycode: options.country,
        topAirports: options.top
      };

      const data = await withSpinner('Searching airports...', () => searchAirports(opts));

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold(`\nAirports\n`));

      const airports = data.data || [];
      const tableData = airports.map(airport => ({
        iata: airport.iata_code || 'N/A',
        name: airport.name || 'Unknown',
        city: airport.municipality || 'N/A',
        country: airport.iso_country || 'N/A',
        elevation: airport.elevation_ft || 'N/A'
      }));

      printTable(tableData, [
        { key: 'iata', label: 'IATA' },
        { key: 'name', label: 'Airport Name' },
        { key: 'city', label: 'City' },
        { key: 'country', label: 'Country' },
        { key: 'elevation', label: 'Elevation (ft)' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// CITIES
// ============================================================

const citiesCmd = program.command('cities').description('Search and discover cities');

citiesCmd
  .command('search <query>')
  .description('Search cities by name (autocomplete-style)')
  .option('--country <code>', 'Filter by country code')
  .option('--language <lang>', 'Language (en, fr, de, es)')
  .option('--json', 'Output as JSON')
  .action(async (query, options) => {
    requireAuth();

    if (query.length < 3) {
      printError('Query must be at least 3 characters');
      process.exit(1);
    }

    try {
      const opts = {
        language: options.language,
        countrycode: options.country
      };

      const data = await withSpinner(`Searching cities for "${query}"...`, () =>
        findCitiesFromText(query, opts)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold(`\nCities matching "${query}"\n`));

      const cities = data.data || [];
      const tableData = cities.map(city => ({
        name: city.name || 'Unknown',
        country: city.country || 'N/A',
        population: city.population || 'N/A',
        timezone: city.timezone || 'N/A'
      }));

      printTable(tableData, [
        { key: 'name', label: 'City' },
        { key: 'country', label: 'Country' },
        { key: 'population', label: 'Population', format: (v) => v === 'N/A' ? v : Number(v).toLocaleString() },
        { key: 'timezone', label: 'Timezone' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

citiesCmd
  .command('nearby')
  .description('Find cities near coordinates')
  .option('--location <coords>', 'Coordinates (lat,long)', '48.8566,2.3522')
  .option('--radius <km>', 'Search radius in km (max 200)')
  .option('--country <code>', 'Filter by country code')
  .option('--limit <n>', 'Maximum results (max 50)')
  .option('--language <lang>', 'Language (en, fr, de, es)')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();

    try {
      const opts = {
        language: options.language,
        location: options.location,
        radius: options.radius,
        countrycode: options.country,
        limit: options.limit
      };

      const data = await withSpinner('Finding nearby cities...', () =>
        findCitiesFromLatLong(opts)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold(`\nCities near ${options.location}\n`));

      const cities = data.data || [];
      const tableData = cities.map(city => ({
        name: city.name || 'Unknown',
        country: city.country || 'N/A',
        population: city.population || 'N/A',
        elevation: city.elevation || 'N/A'
      }));

      printTable(tableData, [
        { key: 'name', label: 'City' },
        { key: 'country', label: 'Country' },
        { key: 'population', label: 'Population', format: (v) => v === 'N/A' ? v : Number(v).toLocaleString() },
        { key: 'elevation', label: 'Elevation (m)' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

citiesCmd
  .command('significant')
  .description('Find major cities by population')
  .option('--country <code>', 'Filter by country code')
  .option('--population <percent>', 'Population percentage threshold')
  .option('--limit <n>', 'Maximum results (max 50)')
  .option('--language <lang>', 'Language (en, fr, de, es)')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();

    try {
      const opts = {
        language: options.language,
        countrycode: options.country,
        population: options.population,
        limit: options.limit
      };

      const data = await withSpinner('Finding significant cities...', () =>
        getSignificantCities(opts)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold(`\nSignificant Cities\n`));

      const cities = data.data || [];
      const tableData = cities.map(city => ({
        name: city.name || 'Unknown',
        country: city.country || 'N/A',
        population: city.population || 'N/A',
        capital: city.capital || 'N/A'
      }));

      printTable(tableData, [
        { key: 'name', label: 'City' },
        { key: 'country', label: 'Country' },
        { key: 'population', label: 'Population', format: (v) => v === 'N/A' ? v : Number(v).toLocaleString() },
        { key: 'capital', label: 'Capital Status' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// COUNTRIES
// ============================================================

program
  .command('countries [code]')
  .description('List all countries or get specific country data')
  .option('--language <lang>', 'Language (en, fr, de, es)')
  .option('--json', 'Output as JSON')
  .action(async (code, options) => {
    requireAuth();

    try {
      const opts = {
        language: options.language,
        countrycode: code
      };

      const data = await withSpinner(code ? `Fetching data for ${code}...` : 'Fetching countries...', () =>
        getCountries(opts)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold(`\nCountries\n`));

      const countries = data.data || [];
      const tableData = countries.map(country => ({
        code: country.cca2 || 'N/A',
        name: country.name || 'Unknown',
        capital: country.capital || 'N/A',
        population: country.population || 'N/A',
        area: country.area || 'N/A'
      }));

      printTable(tableData, [
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Country' },
        { key: 'capital', label: 'Capital' },
        { key: 'population', label: 'Population', format: (v) => v === 'N/A' ? v : Number(v).toLocaleString() },
        { key: 'area', label: 'Area (km²)', format: (v) => v === 'N/A' ? v : Number(v).toLocaleString() }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// CONTINENTS
// ============================================================

program
  .command('continents [code]')
  .description('Get continent information')
  .option('--language <lang>', 'Language (en, fr, de, es)')
  .option('--json', 'Output as JSON')
  .action(async (code, options) => {
    requireAuth();

    try {
      const opts = {
        language: options.language,
        code: code
      };

      const data = await withSpinner('Fetching continents...', () => getContinents(opts));

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold(`\nContinents\n`));

      const continents = data.data || [];
      const tableData = continents.map(continent => ({
        code: continent.code || 'N/A',
        name: continent.name || 'Unknown',
        countries: continent.countries ? continent.countries.length : 'N/A'
      }));

      printTable(tableData, [
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Continent' },
        { key: 'countries', label: 'Countries' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// ELEVATION
// ============================================================

program
  .command('elevation <locations>')
  .description('Get elevation for coordinates (pipe-separated: "lat,long|lat,long")')
  .option('--unit <unit>', 'Unit (meters or feet)', 'meters')
  .option('--json', 'Output as JSON')
  .action(async (locations, options) => {
    requireAuth();

    try {
      const data = await withSpinner('Fetching elevation data...', () =>
        getElevation(locations, options.unit)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold(`\nElevation\n`));

      const results = data.data || [];
      const tableData = results.map(result => ({
        location: result.location || 'N/A',
        elevation: result.elevation || 'N/A',
        unit: result.unit || options.unit
      }));

      printTable(tableData, [
        { key: 'location', label: 'Location' },
        { key: 'elevation', label: 'Elevation' },
        { key: 'unit', label: 'Unit' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// DISTANCE
// ============================================================

program
  .command('distance <locationA> <locationB>')
  .description('Calculate distance between two points (coords or IATA codes)')
  .option('--unit <unit>', 'Unit (kms or miles)', 'kms')
  .option('--json', 'Output as JSON')
  .action(async (locationA, locationB, options) => {
    requireAuth();

    try {
      const data = await withSpinner(`Calculating distance...`, () =>
        getDistance(locationA, locationB, options.unit)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold('\nDistance\n'));
      console.log(`From:     ${chalk.cyan(locationA)}`);
      console.log(`To:       ${chalk.cyan(locationB)}`);
      console.log(`Distance: ${chalk.green(data.data?.distance || 'N/A')} ${options.unit}`);
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// SUN POSITIONS
// ============================================================

program
  .command('sun <location>')
  .description('Get solar cycle data (sunrise, sunset, etc.) for a location')
  .option('--date <date>', 'Date (YYYY-MM-DD)')
  .option('--json', 'Output as JSON')
  .action(async (location, options) => {
    requireAuth();

    try {
      const data = await withSpinner('Fetching sun positions...', () =>
        getSunPositions(location, options.date)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold(`\nSun Positions for ${location}\n`));

      const sunData = data.data || {};
      Object.entries(sunData).forEach(([key, value]) => {
        console.log(`${key.padEnd(20)} ${chalk.cyan(value)}`);
      });
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// TIMEZONE
// ============================================================

program
  .command('timezone <location>')
  .description('Get timezone and current time for a location')
  .option('--json', 'Output as JSON')
  .action(async (location, options) => {
    requireAuth();

    try {
      const data = await withSpinner('Fetching timezone...', () => getTimezone(location));

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold(`\nTimezone for ${location}\n`));
      console.log(`Timezone:      ${chalk.cyan(data.data?.timezone || 'N/A')}`);
      console.log(`Current time:  ${chalk.green(data.data?.current_time || 'N/A')}`);
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// PING
// ============================================================

program
  .command('ping')
  .description('Health check - verify API connectivity')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();

    try {
      const data = await withSpinner('Pinging API...', () => ping());

      if (options.json) {
        printJson(data);
        return;
      }

      printSuccess('API is responding');
      console.log(chalk.dim(`Message: ${data.message || 'pong'}`));
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// Parse
// ============================================================

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.help();
}
