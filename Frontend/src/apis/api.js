const baseURL = "http://localhost:5200";

export const api = async (
  path,
  { method = "GET", body = null, params = null } = {}
) => {
  let url = baseURL + path;
  if (params) {
    const query = new URLSearchParams(params).toString();
    url += "?" + query;
  }

  console.log("📡 FRONTEND API CALL →", {
    url,
    method,
    body,
    params,
  });
  const headers = {
    "Content-Type": "application/json",
  };
  const token = localStorage.getItem("token");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const options = {
    method,
    headers,
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    let errorMessage = "Request failed";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || `Error ${response.status}`;
    } catch (e) {
      errorMessage = `Error ${response.status}: ${response.statusText}`;
    }
    console.error("❌ API ERROR:", errorMessage);
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  console.log("✅ API SUCCESS →", data);
  return data;
};
