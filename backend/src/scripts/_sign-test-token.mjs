import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const token = jwt.sign({ sub: '6d35e386-941f-4599-be11-0e36d01edee4', email: 'expert-test@test.com' }, env.jwtAccessSecret, { expiresIn: '15m' });
console.log(token);
