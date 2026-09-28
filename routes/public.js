import { Router } from 'express';
import { readData } from '../lib/data-store.js';

const publicRouter = Router();

// Public product catalog; mutations are handled by the admin router.
publicRouter.get('/api/products', async (req, res) => {
  const products = await readData('products.json');
  res.json(products);
});

export default publicRouter;