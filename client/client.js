"use strict";
const inquirer = require("inquirer");
const { PeerRPCClient } = require("grenache-nodejs-ws");
const Link = require("grenache-nodejs-link");
const link = new Link({
  grape: "http://127.0.0.1:30001",
  requestTimeout: 10000,
});
link.start();

const peer = new PeerRPCClient(link, {});
peer.init();

var questions = [
  {
    type: "input",
    name: "userId",
    message: "What's your userId?",
  },
  {
    type: "input",
    name: "sellCurId",
    message: "What's your sell currency?",
  },
  {
    type: "input",
    name: "buyCurId",
    message: "What's your buy currency?",
  },
  {
    type: "input",
    name: "amount",
    message: "How much do you want to change the money?",
  },
];

function inputLoop() {
  inquirer.prompt(questions).then((answers) => {
    const payload = {
      userId: answers["userId"],
      sellCurId: answers["sellCurId"],
      buyCurId: answers["buyCurId"],
      amount: answers["amount"],
    };

    peer.request("swapper", payload, { timeout: 100000 }, (err, result) => {
      if (err) throw err;
      console.log(
        "SellCurrency: ",
        payload.sellCurId,
        ", BuyCurrency: ",
        payload.buyCurId,
        ", amount: ",
        payload.amount,
        ", completeRatio: ",
        result,
        "%"
      );
      inputLoop();
    });
  });
}

inquirer.prompt(questions).then((answers) => {
  const payload = {
    userId: answers["userId"],
    sellCurId: answers["sellCurId"],
    buyCurId: answers["buyCurId"],
    amount: answers["amount"],
  };

  peer.request("swapper", payload, { timeout: 100000 }, (err, result) => {
    if (err) throw err;
    console.log(
      "SellCurrency: ",
      payload.sellCurId,
      ", BuyCurrency: ",
      payload.buyCurId,
      ", amount: ",
      payload.amount,
      ", completeRatio: ",
      result,
      "%"
    );
    inputLoop();
  });
});
