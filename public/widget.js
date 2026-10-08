(function() {
  var scriptTag = document.currentScript || document.querySelector("script[data-workspace]");
  if (!scriptTag) {
    console.error("heyo widget: unable to find script tag with data-workspace");
    return;
  }

  var workspaceId = scriptTag.getAttribute("data-workspace");
  var position = scriptTag.getAttribute("data-position") || "right";
  var host = scriptTag.getAttribute("data-host");

  if (!workspaceId) {
    console.error("heyo widget: data-workspace attribute is required");
    return;
  }

  if (!host) {
    try {
      var scriptSrc = new URL(scriptTag.src);
      host = scriptSrc.origin;
    } catch (e) {
      host = window.location.origin;
    }
  }

  var visitorToken = localStorage.getItem("heyo_visitor_token");
  if (!visitorToken) {
    visitorToken = "v_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
    localStorage.setItem("heyo_visitor_token", visitorToken);
  }

  var iframe = document.createElement("iframe");
  iframe.src = host + "/embed/" + workspaceId + "?visitor_token=" + visitorToken + "&position=" + position + "&origin=" + encodeURIComponent(window.location.origin);
  
  iframe.style.setProperty("position", "fixed", "important");
  iframe.style.setProperty("bottom", "20px", "important");
  iframe.style.setProperty("width", "64px", "important");
  iframe.style.setProperty("height", "64px", "important");
  iframe.style.setProperty("border", "none", "important");
  iframe.style.setProperty("z-index", "2147483647", "important");
  iframe.style.setProperty("background", "transparent", "important");
  iframe.style.setProperty("color-scheme", "auto", "important");

  if (position === "left") {
    iframe.style.setProperty("left", "20px", "important");
  } else {
    iframe.style.setProperty("right", "20px", "important");
  }

  var existing = document.getElementById("heyo-widget-container");
  if (existing) {
    existing.remove();
  }

  var container = document.createElement("div");
  container.id = "heyo-widget-container";
  container.appendChild(iframe);
  document.body.appendChild(container);

  window.addEventListener("message", function(event) {
    if (event.origin !== host) return;

    if (event.data && event.data.type === "heyo:resize") {
      var isMobile = window.innerWidth < 640;
      if (event.data.expanded) {
        if (isMobile) {
          document.body.style.overflow = "hidden";
          iframe.style.setProperty("width", "100vw", "important");
          iframe.style.setProperty("height", "100dvh", "important");
          iframe.style.setProperty("max-height", "none", "important");
          iframe.style.setProperty("bottom", "0", "important");
          iframe.style.setProperty("border-radius", "0", "important");
          if (position === "left") {
            iframe.style.setProperty("left", "0", "important");
          } else {
            iframe.style.setProperty("right", "0", "important");
          }
        } else {
          iframe.style.setProperty("width", "380px", "important");
          iframe.style.setProperty("height", "640px", "important");
          iframe.style.setProperty("max-height", "calc(100vh - 40px)", "important");
          iframe.style.setProperty("box-shadow", "0 10px 40px -10px rgba(0,0,0,0.2)", "important");
          iframe.style.setProperty("border-radius", "16px", "important");
        }
      } else {
        document.body.style.overflow = "";
        iframe.style.setProperty("width", "64px", "important");
        iframe.style.setProperty("height", "64px", "important");
        iframe.style.setProperty("max-height", "none", "important");
        iframe.style.setProperty("box-shadow", "none", "important");
        iframe.style.setProperty("border-radius", "0", "important");
        iframe.style.setProperty("bottom", "20px", "important");
        if (position === "left") {
          iframe.style.setProperty("left", "20px", "important");
        } else {
          iframe.style.setProperty("right", "20px", "important");
        }
      }
    } else if (event.data && event.data.type === "heyo:reposition") {
      var nextPos = event.data.position || "right";
      position = nextPos;
      if (nextPos === "left") {
        iframe.style.setProperty("left", "20px", "important");
        iframe.style.setProperty("right", "auto", "important");
      } else {
        iframe.style.setProperty("right", "20px", "important");
        iframe.style.setProperty("left", "auto", "important");
      }
    } else if (event.data && event.data.type === "heyo:ready") {
      iframe.contentWindow.postMessage({ type: "heyo:init", origin: window.location.origin }, host);
    }
  });
})();
