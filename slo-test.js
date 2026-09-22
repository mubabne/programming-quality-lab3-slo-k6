import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 20,
  duration: __ENV.DURATION || '1m',
  thresholds: {
    'http_req_duration{name:cart}': ['p(95)<10'],
    'http_req_failed{name:pay}': ['rate<0.08'],
    checks: ['rate>0.90'],
    'http_req_duration{name:report}': ['p(95)<450'],
  },
};

export default function () {
  const baseUrl = 'http://localhost:3000';

  const cartResponse = http.post(`${baseUrl}/cart/add`, null, {
    tags: { name: 'cart' },
  });
  const reportResponse = http.get(`${baseUrl}/report`, {
    tags: { name: 'report' },
  });
  const payResponse = http.post(`${baseUrl}/pay`, null, {
    tags: { name: 'pay' },
  });

  check(cartResponse, { 'cart 200': (response) => response.status === 200 });
  check(reportResponse, { 'report 200': (response) => response.status === 200 });
  check(payResponse, { 'pay 200': (response) => response.status === 200 });

  sleep(1);
}
