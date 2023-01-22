import axios from "axios";

import { API_URL } from "../constants";
import { userActions } from "../../store/reducers";
import { store } from "../../store";
import { sign_message } from "../utils";

const RequestInProgress = new Set();

let config = {
  api_key: null,
  private_key: null,
};

export let apiInited = false;

export const balanceCheckWatcher = async () => {
  if (apiInited) {
    const responseDeposit = await checkDeposit();
    const responseBalance = await getMyBalance();

    console.log("responseDeposit", responseDeposit);

    if (responseBalance?.data) {
      store.dispatch(
        userActions.setBalances(responseBalance?.data?.balanceCheckWatcher)
      );
    }
  }
};

export const setApiConfig = ({ newConfigValue }: { newConfigValue: any }) => {
  config = newConfigValue;
  apiInited = true;

  return;
};

export const apiInit = async ({
  payload,
}: {
  payload: { init_data: object };
}) => {
  if (RequestInProgress.has("webapp")) {
    throw new Error("busy");
  }

  RequestInProgress.add("webapp");

  const response = await axios
    .post(API_URL + "account.webapp", payload)
    .finally(() => {
      RequestInProgress.delete("webapp");
    });

  return response;
};

export const getMyServerData = async () => {
  if (RequestInProgress.has("me")) {
    throw new Error("busy");
  }

  RequestInProgress.add("me");

  const response = await axios
    .get(API_URL + "account.me", {
      headers: {
        "X-API-Key": config.api_key,
      },
    })
    .finally(() => {
      RequestInProgress.delete("me");
    });

  return response;
};

export const getMyBalance = async () => {
  if (RequestInProgress.has("balances")) {
    throw new Error("busy");
  }

  RequestInProgress.add("balances");

  const response = await axios
    .get(API_URL + "account.balances", {
      headers: {
        "X-API-Key": config.api_key,
      },
    })
    .finally(() => {
      RequestInProgress.delete("balances");
    });

  return response;
};

export const sendCoins = async ({
  payload,
}: {
  payload: {
    ton_address: string;
    currency: string;
    amount: number;
  };
}) => {
  if (RequestInProgress.has("withdraw")) {
    throw new Error("busy");
  }

  RequestInProgress.add("withdraw");

  try {
    const signedMessage = await sign_message(payload, config.private_key);

    const response = await axios
      .post(
        API_URL + "account.withdraw",
        {
          ...signedMessage,
        },
        {
          headers: {
            "X-API-Key": config.api_key,
          },
        }
      )
      .finally(() => {
        RequestInProgress.delete("withdraw");
      });

    return response;
  } catch (e) {
    RequestInProgress.delete("withdraw");

    return e;
  }
};

export const checkDeposit = async () => {
  if (RequestInProgress.has("submitDeposit")) {
    throw new Error("busy");
  }

  RequestInProgress.add("submitDeposit");

  const response = await axios
    .post(API_URL + "account.submitDeposit", null, {
      headers: {
        "X-API-Key": config.api_key,
      },
    })
    .finally(() => {
      RequestInProgress.delete("submitDeposit");
    });

  return response;
};

export const getAllCurrencies = async () => {
  if (RequestInProgress.has("currencies")) {
    throw new Error("busy");
  }

  RequestInProgress.add("currencies");

  const response = await axios
    .get(API_URL + "system.currencies")
    .finally(() => {
      RequestInProgress.delete("currencsies");
    });

  return response;
};
