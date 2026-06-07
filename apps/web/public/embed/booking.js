/**
 * CleanOps Booking Widget — embed script
 * Usage: <script src="https://cleanops.yzysong.com/embed/booking.js" data-company="YOUR_COMPANY_ID"></script>
 */
(function () {
  const script = document.currentScript;
  if (!script) return;

  const companyId = script.getAttribute("data-company") || "";
  const container = document.createElement("div");
  container.id = "cleanops-booking-widget";
  script.parentNode!.insertBefore(container, script);

  const iframe = document.createElement("iframe");
  iframe.src = `https://cleanops.yzysong.com/embed/booking?companyId=${encodeURIComponent(companyId)}`;
  iframe.style.width = "100%";
  iframe.style.height = "800px";
  iframe.style.border = "none";
  iframe.style.overflow = "hidden";
  iframe.setAttribute("scrolling", "no");
  iframe.setAttribute("title", "Book a Cleaning Service");

  container.appendChild(iframe);

  // Auto-resize iframe based on content height
  window.addEventListener("message", function (event) {
    if (event.origin !== "https://cleanops.yzysong.com") return;
    if (event.data && event.data.type === "resize") {
      iframe.style.height = event.data.height + "px";
    }
  });
})();
