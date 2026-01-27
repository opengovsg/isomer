export interface GetAuthTokenResponse {
  accessToken: string;
  tokenType: string;
}

export interface GetAllApplicationsResponse {
  data: {
    agencyId: number;
    applicationId: string;
    name: string;
    siteDomain: string;
    environment: string;
  }[];
}

export interface GetSpecificApplicationResponse {
  data: {
    agencyId: number;
    name: string;
    tenant: {
      adminList: string[];
    };
    index: {
      indexType: string;
      dataSource: {
        web: {
          domain: string;
          startingUrl: string;
          documentIndexConfig: {
            indexWhitelist: string[];
            indexBlacklist: string[];
          };
        }[];
        api: string[];
        pushApi: {
          enabled: boolean;
        };
      };
    };
    site: {
      siteClientId: string;
      siteDomain: string;
      environment: string;
      application: [
        {
          appType: string;
          appId: string;
          config: {
            theme: {
              primary: string;
              fontFamily: string;
            };
            isFramed: {
              redirectUrl: string;
            };
            defaultSort: {
              domain: string;
            };
            emptySearchQuery: {
              wog: {
                enabled: boolean;
              };
              domain: {
                enabled: boolean;
              };
            };
            filter: {
              wog: {
                options: {
                  displayName: string;
                  key: string;
                }[];
                enabled: boolean;
              };
              domain: {
                options: {
                  displayName: string;
                  key: string;
                }[];
                enabled: boolean;
              };
            };
          };
        },
      ];
    };
    application: {
      applicationId: string;
      siteDomain: string;
      environment: string;
      config: {
        search: {
          theme: {
            primary: string;
            fontFamily: string;
          };
          isFramed: {
            redirectUrl: string;
          };
          defaultSort: {
            domain: string;
          };
          emptySearchQuery: {
            wog: {
              enabled: boolean;
            };
            domain: {
              enabled: boolean;
            };
          };
          filter: {
            wog: {
              options: {
                displayName: string;
                key: string;
              }[];
              enabled: boolean;
            };
            domain: {
              options: {
                displayName: string;
                key: string;
              }[];
              enabled: boolean;
            };
          };
        };
        chatbot: unknown[];
      };
    };
  };
}

export interface CreateApplicationResponse {
  data: {
    tenant: {
      adminList: [
        {
          email: string;
          isTechpassUser: boolean;
        },
      ];
    };
    application: {
      applicationId: string;
      siteDomain: string;
      environment: string;
    };
  };
}
