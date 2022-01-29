"use strict";
const { PeerRPCServer } = require("grenache-nodejs-ws");
const Link = require("grenache-nodejs-link");
function fibonacci(n) {
  if (n <= 1) {
    return 1;
  }
  return fibonacci(n - 1) + fibonacci(n - 2);
}

var originOrderbook = [];
let currencyPairRatio = [
  {
    sellCurrency: "BTC",
    buyCurrency: "ETH",
    ratio: 200,
  },
  {
    sellCurrency: "BTC",
    buyCurrency: "USDT",
    ratio: 30000,
  },
  {
    sellCurrency: "BTC",
    buyCurrency: "USDC",
    ratio: 30000,
  },
  {
    sellCurrency: "BTC",
    buyCurrency: "ADA",
    ratio: 6000,
  },
];

function addNewOrder(
  orderId,
  userId,
  sellCurId,
  buyCurId,
  amount,
  remainedAmount,
  completeRatio
) {
  let newOrder = {
    orderId: orderId,
    userId: userId,
    sellCurrency: sellCurId,
    buyCurrency: buyCurId,
    amount: amount,
    remainedAmount: remainedAmount,
    completeRatio: completeRatio,
  };
  originOrderbook.push(newOrder);
}

function swap(userId, sellCurId, buyCurId, amount) {
  if (originOrderbook.length == 0) {
    addNewOrder(1, userId, sellCurId, buyCurId, amount, amount, 0);
    return originOrderbook[0].completeRatio;
  } else {
    let matchOrder = originOrderbook.filter(
      (order) =>
        order.buyCurrency === sellCurId &&
        order.sellCurrency === buyCurId &&
        order.remainedAmount > 0 &&
        order.userId != userId
    );

    if (matchOrder.length == 0) {
      const orderId = originOrderbook.length;
      addNewOrder(orderId + 1, userId, sellCurId, buyCurId, amount, amount, 0);
      return originOrderbook[orderId].completeRatio;
    } else {
      const currentPair = currencyPairRatio.find(
        (pair) =>
          (pair.sellCurrency === sellCurId && pair.buyCurrency === buyCurId) ||
          (pair.sellCurrency === buyCurId && pair.buyCurrency === sellCurId)
      );

      let currencyRatio = -1;
      if (currentPair.sellCurrency === sellCurId)
        currencyRatio = currentPair.ratio;
      else currencyRatio = 1 / currentPair.ratio;

      let convertAmount = amount * currencyRatio;

      for (let i = 0; i < matchOrder.length; i++) {
        const order = matchOrder[i];
        if (convertAmount > order.remainedAmount) {
          convertAmount = convertAmount - order.remainedAmount;
          originOrderbook[order.orderId - 1].remainedAmount = 0;
          originOrderbook[order.orderId - 1].completeRatio = 100;
        } else {
          convertAmount = 0;
          originOrderbook[order.orderId - 1].remainedAmount =
            order.remainedAmount - convertAmount;
          originOrderbook[order.orderId - 1].completeRatio =
            ((order.amount - (order.remainedAmount - convertAmount)) * 100) /
            order.amount;
          break;
        }
      }

      const orderId = originOrderbook.length;
      const remianedAmount = convertAmount / currencyRatio;
      const compRatio = ((amount - remianedAmount) * 100) / amount;
      addNewOrder(
        orderId + 1,
        userId,
        sellCurId,
        buyCurId,
        amount,
        remianedAmount,
        compRatio
      );
      return originOrderbook[orderId].completeRatio;
    }
  }
}

const link = new Link({
  grape: "http://127.0.0.1:30001",
});
link.start();
const peer = new PeerRPCServer(link, {});
peer.init();
const service = peer.transport("server");
service.listen(1337);

setInterval(() => {
  link.announce("swapper", service.port, {});
}, 1000);

service.on("request", (rid, key, payload, handler) => {
  const result = swap(
    payload.userId,
    payload.sellCurId,
    payload.buyCurId,
    payload.amount
  );
  handler.reply(null, result);
});
