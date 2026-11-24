export const appConfig = {
  apiEnabled: window.__KITCHEN_CONFIG__?.apiEnabled === true,
  apiBaseUrl: window.__KITCHEN_CONFIG__?.apiBaseUrl || '/api',
};
