import axios from 'axios';

axios.defaults.baseURL = `http://${process.env.HOST ?? 'localhost'}:${process.env.PORT ?? '3000'}`;
