/*
 * Property Link Partners — site configuration
 *
 * FORM DELIVERY (setup required)
 * ------------------------------
 * The three inquiry forms on /contact/ send submissions with a standard HTTP POST
 * to the endpoint URLs below (for example, a Formspree, Basin, Getform, or your own
 * server endpoint that accepts multipart form data and returns a 2xx status).
 *
 * While an endpoint is empty, the matching form displays a visible
 * "not connected" notice and will NOT pretend to submit. A success message is
 * only shown after the endpoint responds successfully.
 */
window.PLP_CONFIG = {
  formEndpoints: {
    va: "",        // VA service inquiries
    owner: "",     // Property owner inquiries
    investor: ""   // Investor buyer criteria
  }
};
