export const environment = {
  production: true,
  // Replaced at Docker build time (see Dockerfile ARG API_URL).
  // Local docker-compose keeps '/api' (nginx proxy). Railway sets the public backend URL.
  apiUrl: '__API_URL__',
};
