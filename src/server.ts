import 'dotenv/config';
import '@/index';
import App from '@/app';
import AuthRoute from '@routes/auth.route';
import IndexRoute from '@routes/index.route';
import UsersRoute from '@routes/users.route';
import ProjectsRoute from '@routes/project.route';
import DevelopersRoute from '@routes/developers.route';
import MembersRoute from '@routes/members.route';
import OwnersRoute from '@routes/owners.route';
import PropertyRoute from '@routes/property.route';
import ArchitectRoute from '@routes/architect.route';
import MozniRoute from '@routes/mozni.route';
import TransactionRoute from '@routes/transaction.route';
import FavouriteRoute from './routes/favourite.route';
import validateEnv from '@utils/validateEnv';
import ExcelsRoute from './routes/excel.route';
import LawyerRoute from '@routes/lawyer.route';

validateEnv();

const app = new App([new IndexRoute(), new UsersRoute(), new AuthRoute(), 
    new DevelopersRoute, new ProjectsRoute, new MembersRoute, new OwnersRoute, 
    new PropertyRoute, new ArchitectRoute, new MozniRoute, new FavouriteRoute,
    new TransactionRoute, new LawyerRoute, new ExcelsRoute]);

    
app.listen();
