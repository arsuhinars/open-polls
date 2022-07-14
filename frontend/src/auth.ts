import User from "./models/user";
import router from "./router";

function login() {
  document.location.href = `/auth/login?redirectPath=${encodeURIComponent(
    document.location.href
  )}`;
}

function logout() {
  if (sessionStorage.isAuthorized) {
    fetch("/auth/logout")
      .then((response) => {
        if (response.ok) {
          sessionStorage.isAuthorized = false;
          sessionStorage.removeItem("user");
          sessionStorage.removeItem("userPhoto");
          router.go(0);
        }
      })
      .catch((error) => {
        console.error("Logout error:", error);
      });
  }
}

async function checkAuthorization() {
  try {
    const response = await fetch("/auth/user");
    const json = await response.json();
    if (response.ok) {
      sessionStorage.isAuthorized = true;
      sessionStorage.user = JSON.stringify(json.user);
      sessionStorage.userPhoto = json.photo ?? "";
    } else if (json.errorCode || json.user == null) {
      sessionStorage.isAuthorized = false;
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("userPhoto");
    }
  } catch (error) {
    console.error(error);
  }
}

export default {
  login,
  logout,
  checkAuthorization,
  get isAuthorized() {
    return sessionStorage.isAuthorized != null
      ? (JSON.parse(sessionStorage.isAuthorized) as boolean)
      : false;
  },
  get user() {
    return sessionStorage.user == null
      ? null
      : (JSON.parse(sessionStorage.user) as User);
  },
  get userPhoto() {
    return sessionStorage.userPhoto == null
      ? ""
      : (sessionStorage.userPhoto as string);
  },
};
