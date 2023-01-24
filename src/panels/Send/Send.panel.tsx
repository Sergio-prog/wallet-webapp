import { FC, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import { balanceCheckWatcher, sendCoins } from "../../api";

import { countCharts, formatNumber } from "../../utils";

import {
  currencyDataSelector,
  myTonBalanceSelector,
} from "../../store/reducers/user/user.selectors";

import {
  Avatar,
  Block,
  Button,
  Cell,
  ErrorBlock,
  Group,
  Input,
  Panel,
  Text,
} from "../../components";

import { ReactComponent as QRCopy17OutlineIcon } from "../../icons/QRCopy17Outline.svg";
import { ReactComponent as Date24OutlineIcon } from "../../icons/Date24Outline.svg";

import ton from "../../images/ton.jpeg";

export const SendPanel: FC = () => {
  const [formData, setFormData] = useState({
    receiverToken: "",
    amount: "",
  });

  const [isAwaitResponse, setIsAwaitResponse] = useState<boolean>(false);
  const [error, setError] = useState(null);

  const errorBlockTimeoutRef = useRef<NodeJS.Timer | undefined>(undefined);

  const isButtonDisabled =
    !formData.receiverToken ||
    !formData.amount ||
    isNaN(Number(formData.amount)) ||
    Number(formData.amount) <= 0 ||
    isAwaitResponse;

  const { state: locationState }: { state: any } = useLocation();

  const currencyData = useSelector((state) =>
    currencyDataSelector(state, locationState.currency)
  );

  const myTonBalance = useSelector(myTonBalanceSelector);

  const comission =
    currencyData?.currency === "ton" || currencyData?.verified ? 0.05 : 0.1;

  const navigate = useNavigate();

  const openQRScanner = () => {
    (window as any).Telegram.WebApp.showScanQrPopup({
      text: "Scan token",
    });
  };

  useEffect(() => {
    const handlerQRText = ({ data }: { data: string }) => {
      setFormData((prev) => ({
        ...prev,
        receiverToken: data.split("ton://transfer/")[1],
      }));

      (window as any).Telegram.WebApp.closeScanQrPopup();
    };

    (window as any).Telegram.WebApp.onEvent("qrTextReceived", handlerQRText);
    (window as any).Telegram.WebApp.enableClosingConfirmation();

    return () => {
      (window as any).Telegram.WebApp.offEvent("qrTextReceived", handlerQRText);
      (window as any).Telegram.WebApp.disableClosingConfirmation();
    };
  }, []);

  useEffect(() => {
    if (error) {
      if (errorBlockTimeoutRef.current) {
        clearTimeout(errorBlockTimeoutRef.current);
      }

      errorBlockTimeoutRef.current = setTimeout(() => {
        setError(null);
      }, 3000);
    }

    return () => {
      clearTimeout(errorBlockTimeoutRef.current);
      errorBlockTimeoutRef.current = undefined;
    };
  }, [error]);

  const selectMaxAmount = () => {
    let newAmount = "";

    if (currencyData.currency === "ton") {
      if (currencyData?.amount <= 0.05) {
        newAmount = "0";
      } else {
        newAmount =
          String(+(Number(currencyData?.amount) - 0.05).toFixed(3)) || "";
      }
    } else {
      newAmount = String(+Number(currencyData?.amount).toFixed(3)) || "";
    }

    setFormData({
      ...formData,
      amount: newAmount,
    });
  };

  const withdraw = async () => {
    if (myTonBalance.amount < comission) {
      (window as any).Telegram.WebApp.showAlert("You don't have enough TON");

      return;
    }

    setIsAwaitResponse(true);

    const payload = {
      ton_address: formData.receiverToken,
      amount: Number(formData.amount),
      currency: locationState.currency,
    };

    const response: any = await sendCoins({
      payload,
    }).finally(() => {
      setIsAwaitResponse(false);
    });

    console.debug("response", response, response.data);

    if (
      response?.data &&
      !response?.response?.data.error &&
      !response?.data.error
    ) {
      await balanceCheckWatcher();

      navigate("/send/success", {
        state: {
          receiverToken: formData.receiverToken,
          currency: locationState.currency,
          amount: Number(formData.amount),
        },
      });
    } else if (response?.response?.data?.error) {
      setError(response?.response?.data?.error);
    } else if (response?.data?.error) {
      setError(response?.data?.error);
    }
  };

  return (
    <Panel>
      <Group space={24}>
        <Block padding={24}>
          <Cell
            after={
              <Text
                weight={"600"}
                size={14}
                lineHeight={"17px"}
                color={"var(--accent)"}
              >
                {formatNumber(currencyData?.amount)}{" "}
                {currencyData?.currency.toUpperCase()}
              </Text>
            }
            before={
              <Avatar
                size={42}
                fallbackName={currencyData?.currency.slice(0, 1)}
                src={
                  currencyData.currency === "ton" ? ton : currencyData?.image
                }
              />
            }
          >
            {currencyData?.name}
          </Cell>
        </Block>
        <Group space={12}>
          <Input
            placeholder="Enter receiver address"
            after={
              <QRCopy17OutlineIcon
                style={{ cursor: "pointer" }}
                color="var(--accent)"
                onClick={openQRScanner}
              />
            }
            value={formData.receiverToken}
            onChange={(e) => {
              const newValue = e?.currentTarget.value;

              setFormData({
                ...formData,
                receiverToken: newValue || "",
              });
            }}
            disabled={isAwaitResponse}
          />
          <Input
            placeholder="Amount"
            after={
              <div onClick={selectMaxAmount}>
                <Text
                  weight={"600"}
                  size={14}
                  lineHeight={"17px"}
                  color={"var(--accent)"}
                  style={{ cursor: "pointer" }}
                >
                  Max
                </Text>
              </div>
            }
            value={formData.amount}
            onChange={(e) => {
              let newValue = (e?.currentTarget.value || "").replace(
                /[^\d.-]+/g,
                ""
              );

              if (countCharts(newValue || "", ".") > 1) {
                return;
              }

              if (countCharts(newValue || "", ".") === 1) {
                const chartsAfterDot = newValue.split(".")[1];

                if (chartsAfterDot.length > 3) {
                  return;
                }
              }

              if (Number(newValue) > currencyData?.amount) {
                newValue = formatNumber(currencyData?.amount);
              }

              setFormData({
                ...formData,
                amount: newValue,
              });
            }}
            disabled={isAwaitResponse}
          />
        </Group>
        <ErrorBlock
          text={`Comission — ${comission} TON`}
          iconColor="var(--color_primary_color)"
          color="var(--background_block)"
          backgroundColor="transparent"
        />
        <Button
          size="m"
          mode="primary"
          onClick={withdraw}
          disabled={isButtonDisabled}
          before={isAwaitResponse ? <Date24OutlineIcon /> : null}
        >
          {isAwaitResponse ? "Sending..." : "Send"}
        </Button>
        {error ? <ErrorBlock text={error} /> : null}
      </Group>
    </Panel>
  );
};
