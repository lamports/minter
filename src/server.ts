process.env['NODE_CONFIG_DIR'] = __dirname + '/configs';

import 'dotenv/config';
import App from '@/app';
import IndexRoute from '@routes/index.route';
import validateEnv from '@utils/validateEnv';
import ProgramRoute from './routes/program.route';

validateEnv();

const app = new App([new IndexRoute(), new ProgramRoute()]);

app.listen();
