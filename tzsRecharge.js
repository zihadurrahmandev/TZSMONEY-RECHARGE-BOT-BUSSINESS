const libPrefix = "tzsmoneylib";
const API_BASE_URL = "http://tzsmoney.com/api/";

// Save API key to bot property storage
function setApiKey(key) {
  Bot.setProperty(`${libPrefix}apiKey`, key, "string");
}

// Load API key from bot property storage
function loadApiKey() {
  const apiKey = Bot.getProperty(`${libPrefix}apiKey`);
  if (!apiKey) throwError("no apiKey. You need to setup it");
  return apiKey;
}

// Convert object params into URL-encoded query string
function getQueryParams(params) {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}

// Centralized error thrower for consistency
function throwError(message) {
  throw `TZS Lib: ${message}`;
}

// Send error message to user (non-blocking error reporting)
function sendError(message) {
  Bot.sendMessage(`TZS Recharge error: ${message || "Unknown error"}`);
}

// Validate required fields in params object
function validateOptions(options, requiredFields) {
  requiredFields.forEach(field => {
    if (!options[field]) {
      throwError(`need options.${field}`);
    }
  });
}

// Build callback string for HTTP request
function buildCallback(eventName, onSuccess, onError) {
  return `${libPrefix}${eventName} ${onSuccess || ""} ${onError || ""}`;
}

// Generic API call function for any method
function apiCall({ method, params = {}, onSuccess, onError, requiredFields = [] }) {
  if (!method) throwError("need method name");

  validateOptions(params, requiredFields);

  const apiKey = loadApiKey();
  const fields = { ...params, api_key: apiKey };
  const queryParams = getQueryParams(fields);
  const url = `${API_BASE_URL}${method}?${queryParams}`;

  const callback = buildCallback("onApiResponse", onSuccess, onError);

  HTTP.get({ url, success: callback });
}

// Generic response handler for all API methods
function onApiResponse() {
  const json = JSON.parse(content);
  const [onSuccess, onError] = params.split(" ").map(p => p.trim());

  const handlers = {
    success: () => onSuccess && Bot.runCommand(onSuccess, json),
    error: () => {
      if (onError) {
        Bot.runCommand(onError, { message: json.message });
      } else {
        sendError(json.message);
      }
    }
  };

  const action = json.success ? "success" : "error";
  (handlers[action] || (() => sendError(json.message)))();
}

// Register API response handler
on(`${libPrefix}onApiResponse`, onApiResponse);

// Export public functions
publish({
  setApiKey,
  apiCall
});
