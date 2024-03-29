// import the original type declarations
import "react-i18next";
// import all namespaces (for the default language, only)
import ns1 from "locales/ms/ns1.json";
import ns2 from "locales/ms/ns2.json";

// react-i18next versions higher than 11.11.0
declare module "react-i18next" {
  // and extend them!
  interface CustomTypeOptions {
    // custom namespace type if you changed it
    defaultNS: "ns1";
    // custom resources type
    resources: {
      ns1: typeof ns1;
      ns2: typeof ns2;
    };
  }
}
