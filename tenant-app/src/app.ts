import express from 'express';
import bodyParser from 'body-parser';
import { setTenantRoutes } from './routes/tenantRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

setTenantRoutes(app);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});