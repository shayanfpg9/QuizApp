"use strict";
import {
  $,
  validateForm,
  getNextQuestion,
  data,
  allIsInfo,
  message,
} from "./functions.js";

const form = $("form.exam"),
  contentBox = $("form.exam>#content");
let answers = [],
  DBName = localStorage.getItem("solved") || 0,
  DB;

let correct,
  texts,
  title,
  information,
  last = false;

data.contentBox = contentBox;
await data.LoadQuestions("./json/%NAME%.json");

const ConfigUrl = data.MainUrl.replace("%NAME%", "config");
await fetch(ConfigUrl)
  .then((res) => res.json())
  .then((data) => {
    window.config = data;
  });

let start = function () {
  DBName = Math.random() * Math.random() * Math.PI * 1000 + 10;
  localStorage.setItem("solved", DBName);

  DB = indexedDB.open(DBName, 4);
  DB.onupgradeneeded = ({ target }) => {
    const { result } = target;
    result.createObjectStore("answers", { autoIncrement: true });
  };

  DB.onsuccess = () => {
    getNextQuestion({
      function: (Qtitle, c, options, text, l, isInformation) => {
        correct = c;
        texts = text;
        title = Qtitle;
        last = l;
        information = isInformation;
      },
    });
  };

  $(".form").classList.remove("d-none");
  $(".card-body").classList.remove("landing-screen");
  $(".card-body > p").classList.add("d-none");

  start = undefined;
};

function saveAnswer() {
  const answer = $(`[name=input-q${data.index}]`, (result) => {
    try {
      if (result.length > 1) {
        let response = "";

        result.forEach((el) => {
          if (el.checked) {
            response = el.value;
          }
        });

        return response;
      } else {
        return result.value;
      }
    } catch (e) {
      return null;
    }
  });

  answers.push({
    answer: answer,
    title: title,
    correct: correct,
    information: information,
    feedbacks: texts,
  });

  localStorage.setItem("index", answers.length - 1);

  DB = indexedDB.open(DBName, 4);
  const SaveDatas = {
    answer: answer,
    title: title,
    correct: correct,
    information: information,
    feedbacks: texts,
  };

  DB.onsuccess = () => {
    const transaction = DB.result.transaction(["answers"], "readwrite"),
      store = transaction.objectStore("answers");
    store.add(SaveDatas);
  };

  if (last) {
    localStorage.setItem("index", "done");
    showResult();
  }
}

function submit(event) {
  event.preventDefault();

  const validate = new validateForm(form);
  form.classList.add("was-validated");

  if (validate.validate) {
    saveAnswer();
    contentBox.innerHTML = "";
    form.classList.remove("was-validated");

    getNextQuestion({
      function: (Qtitle, c, options, text, l, isInformation) => {
        correct = c;
        texts = text;
        title = Qtitle;
        last = l;
        information = isInformation;
      },
    });
  }
}

form.addEventListener("submit", submit);

function showResult() {
  if (!allIsInfo(answers)) {
    let all = answers,
      mistakes = all.length;

    answers.forEach((answer) => {
      if (!answer.information) {
        let questionStatus = false;

        if (answer.correct == null) {
          questionStatus = true;
        } else {
          if (answer.correct == answer.answer) {
            questionStatus = true;
          }
        }

        if (questionStatus) {
          mistakes--;
        }
      } else {
        all = all.filter((val) => {
          if (val.answer != answer.answer) return val;
        });
        mistakes--;
      }
    });

    const body = $(".card-body"),
      canvasParent = document.createElement("div"),
      contentParent = document.createElement("div"),
      canvas = document.createElement("canvas"),
      ctx = canvas.getContext("2d"),
      score = all.length - mistakes,
      padding = 15,
      mistakeAngle = (Math.PI * 2 * mistakes) / all.length,
      rad = 60;
    let color = "success";

    body.removeChild(form);
    $(".card-title").innerHTML = "the result of the exam";
    $(".card-subtitle").innerHTML = "score: " + score + "/" + all.length;

    if ((score * 100) / all.length < 75) {
      color = "danger";
    }

    canvasParent.innerHTML += `
  <div style="height : 20px;width:4rem">
      <div class="color-navigator bg-danger rounded pill me-1 float-start"></div>
      <span style="margin-top:-5px" class="text-muted float-start">${Math.floor(
        (mistakes * 100) / all.length
      )}%</span>
    </div>
    <div style="height : 20px;width:4rem">
      <div class="color-navigator bg-success rounded pill me-1 float-start"></div>
      <span style="margin-top:-5px" class="text-muted float-start">${Math.floor(
        (score * 100) / all.length
      )}%</span>
    </div>`;
    canvasParent.appendChild(canvas);
    body.appendChild(canvasParent);
    body.appendChild(contentParent);
    body.style.padding = padding;

    $(".card-header").classList.replace("text-bg-primary", `text-bg-${color}`);
    $(".card").classList.replace("border-primary", `border-${color}`);
    canvasParent.classList.add("float-start");
    // canvasParent.classList.add("col-sm-12");
    contentParent.classList.add("float-end");

    canvas.width = (rad + 10) * 2;
    canvas.height = (rad + 10) * 2;

    ctx.beginPath();
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue(
      "--bs-success"
    );

    ctx.arc(rad + 10, canvas.height / 2, rad, 0, Math.PI * 2, false);

    ctx.fill();

    ctx.beginPath();
    ctx.closePath();

    if (mistakeAngle) {
      // debugger
      ctx.beginPath();

      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue(
        "--bs-danger"
      );

      ctx.arc(
        rad + 10,
        canvas.height / 2,
        rad,
        -(Math.PI / 2),
        mistakeAngle - Math.PI / 2,
        false
      );

      ctx.fill();

      ctx.closePath();
    }

    addEventListener("resize", () => {
      setTimeout(() => {
        if (window.innerWidth >= 550) {
          contentParent.style.width = body.clientWidth - (rad + 10) * 3;
        } else {
          contentParent.style.width =
            body.clientWidth - 30 /* the body padding + .card-body padding*/;
        }
      }, 400);
    });

    if (window.innerWidth >= 550) {
      contentParent.style.width = body.clientWidth - (rad + 10) * 3;
    } else {
      contentParent.style.width =
        body.clientWidth - 30 /* the body padding + .card-body padding*/;
    }
    contentParent.style.height = "auto";

    all.forEach((answer, i) => {
      contentParent.innerHTML += `
    <div class="text-bg-${
      answer.answer == answer.correct ? "success" : "danger"
    } rounded shadow d-block p-2 ${i > 0 ? "mt-2" : ""}">
     <h3 class="fs-5">${answer.title}</h3>
     <h4 class="fs-6 ms-2">for question ${i + 1}</h4>
     <hr class="divider"/>
     <p class="ms-3">
        ${answer.feedbacks[answer.answer == answer.correct ? 0 : 1]}
     </p>
    </div>
    `;
    });
  } else {
    const body = $("#body-form");
    body.classList.replace("card", "alert");
    body.classList.remove("border-primary");
    body.classList.add("alert-info");
    body.classList.add("text-center");

    body.innerHTML = `
      <h1 class="alert-heading fs-3">thank you for answering all the questions</h1>
      <p>
        sorry!
        all the questions are personal information
        so we can't show any score to you
      </p>
      <hr>
      <span>for know your score ask from the quiz manager</span>
    `;
  }

  send();
}

if (Number(DBName) && +DBName != 0) {
  $(".form").classList.remove("d-none");
  $(".card-body").classList.remove("landing-screen");
  $(".card-body > p").classList.add("d-none");

  DB = indexedDB.open(DBName, 4);
  DB.onsuccess = () => {
    const transaction = DB.result.transaction(["answers"], "readwrite"),
      objectStore = transaction.objectStore("answers"),
      request = objectStore.getAll();

    request.onsuccess = () => {
      answers = request.result;

      const index = localStorage.getItem("index");
      if (index != "done" && index != null && typeof +index == "number") {
        data.index = +index + 1;
        getNextQuestion({
          index: +index + 1,
          function: (Qtitle, c, options, text, l, isInformation) => {
            correct = c;
            texts = text;
            title = Qtitle;
            last = l;
            information = isInformation;
          },
        });
      } else if (index == null) {
        getNextQuestion({
          function: (Qtitle, c, options, text, l, isInformation) => {
            correct = c;
            texts = text;
            title = Qtitle;
            last = l;
            information = isInformation;
          },
        });
      } else {
        showResult();
      }
    };
  };
} else {
  $(".card-title").innerText = config.name || "";
  $(".card-subtitle").innerText = config.author || "";

  $(".form").classList.add("d-none");
  $(".card-body").classList.add("landing-screen");
  $(".card-body > p").classList.remove("d-none");

  $(".card-body").addEventListener("click", () => {
    if (typeof start !== "undefined") start();
  });

  addEventListener("keyup", (e) => {
    if (e.code == "Space" && typeof start !== "undefined") start();
  });
}

function offline() {
  message({
    timer: 3,
    pos: "top-end",
    icon: "info",
    title: "you're offline",
    msg: "but we store the answers in the cloud",
  });

  addEventListener("online", () => {
    message({
      timer: 3,
      pos: "top-end",
      icon: "success",
      title: "you're online again",
      msg: "",
    });
  });
}

if (!navigator.onLine) {
  offline();
}

addEventListener("offline", () => {
  offline();
});

function get(index) {
  return answers[index - 1];
}

function send() {
  //make sended localhost value

  let all = answers,
    mistakes = all.length;

  answers.forEach((answer) => {
    if (!answer.information) {
      let questionStatus = false;

      if (answer.correct == null) {
        questionStatus = true;
      } else {
        if (answer.correct == answer.answer) {
          questionStatus = true;
        }
      }

      if (questionStatus) {
        mistakes--;
      }
    } else {
      all = all.filter((val) => {
        if (val.answer != answer.answer) return val;
      });
      mistakes--;
    }
  });

  const { download, send } = config,
    variables = {};

  let score = all.length - mistakes;

  if (config.variables != undefined) {
    for (const name in config.variables) {
      variables[name] = eval(config.variables[name]);
    }
  }

  function FindSpecial(text = "", prop = {}) {
    text = text.replace(/%NAME%/g, config.name);
    text = text.replace(/%SCORE%/g, score | "");
    text = text.replace(/%LENGTH%/g, answers.length | "");

    const information = [],
      AllAnswers = [];

    answers.forEach((q, i) => {
      const RetrunObj = {
        index: i,
      };

      if (!q.information) {
        RetrunObj.correct = q.correct == q.answer;

        if (prop?.answers == "all") {
          RetrunObj.answer = +q.answer ? +q.answer : q.answer;
        }

        AllAnswers.push(RetrunObj);
      } else {
        if (prop?.answers == ("all", "information")) {
          RetrunObj.answer = +q.answer ? +q.answer : q.answer;
        }

        information.push(RetrunObj);
      }
    });

    text = text.includes("%INFORMATION%") ? text.split("%INFORMATION%") : text;
    if (typeof text == "object")
      text = text[0] + JSON.stringify(information) + text[1];

    text = text.includes("%ANSWERS%") ? text.split("%ANSWERS%") : text;
    if (typeof text == "object")
      text = text[0] + JSON.stringify(AllAnswers) + text[1];

    for (const name in variables) {
      if (text.includes(`%${name.toUpperCase()}%`))
        text = text.replace(
          new RegExp(`%${name.toUpperCase()}%`, "g"),
          variables[name]
        );
    }
    return text;
  }

  if (download != undefined) {
    let json = {};

    const link = document.createElement("a");
    link.download = config.name;

    json.quiz = config.name;

    if (typeof download !== "object") {
      if (typeof download == "string") link.download = download;

      json.answers = answers.map((q, i) => {
        const RetrunObj = {
          index: i,
          title: q.title,
          information: q.information,
        };

        RetrunObj.answer = q.answer;

        if (q.information == false) {
          RetrunObj.correct = q.correct == q.answer;
        }

        return RetrunObj;
      });
    } else {
      link.download = FindSpecial(download.file) + ".json";
      if (download.QuizName) json.quiz = config.name;
      if (download.examiner) json.examiner = FindSpecial(download.examiner);

      if (download.score) {
        if (download.score == true || download.score == "number") {
          score = `${all.length - mistakes}/${all.length}`;
        } else if (download.score == "precent") {
          score = ((all.length - mistakes) / all.length) * 100;
        }
        if (download.score) json.score = score;
      }

      if (!download.information) {
        answers = answers.filter((v) => {
          return !v.information;
        });
      }

      json.answers = answers.map((q, i) => {
        const RetrunObj = {};

        if (download.index) RetrunObj.index = i;

        if (!q.information) {
          RetrunObj.correct = q.correct == q.answer;

          if (download.ShowAnswers) {
            RetrunObj.answer = +q.answer ? +q.answer : q.answer;
          }
        } else {
          RetrunObj.answer = +q.answer ? +q.answer : q.answer;
        }

        return RetrunObj;
      });
    }

    link.href = CreateJSON(json);
    link.innerText = "download your answer sheet";
    link.classList.add("btn", "btn-success", "mt-3", "download-button");
    $(".card-body").appendChild(link);
  }

  score = all.length - mistakes;

  if (send != undefined) {
    if (typeof send == "string") {
      fetch(FindSpecial(send))
        .then((res) => res.json())
        .catch((e) => {
          console.error(e);
          message({
            icon: "error",
            title: "the answer wasn't sent",
            msg: "check the console for more information",
            timer: 3,
            pos: "top-end",
          });
        })
        .then((json) => {
          if (json !== undefined) {
            message({
              icon: "success",
              title: "we're can send answers successfully",
              msg: "check the console for more information",
              timer: 3,
              pos: "top-end",
            });
            console.log(json);
          }
        });
    } else if (typeof send == "object") {
      if (send.score) {
        if (send.score == true || send.score == "number") {
          score = `${all.length - mistakes}/${all.length}`;
        } else if (send.score == "precent") {
          score = ((all.length - mistakes) / all.length) * 100;
        }
      }

      if (
        !!new RegExp(
          "^(https?:\\/\\/)?" + // protocol
            "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
            "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
            "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
            "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
            "(\\#[-a-z\\d_]*)?$",
          "i"
        ).test(send.to)
      )
        fetch(
          decodeURI(
            send.to + FindSpecial(send.pattern, { answers: send.answers })
          )
        )
          .then((res) => res.json())
          .catch((e) => {
            console.error(e);
            message({
              icon: "error",
              title: "the answer wasn't sent",
              msg: "check the console for more information",
              timer: 3,
              pos: "top-end",
            });
          })
          .then((json) => {
            if (json !== undefined) {
              message({
                icon: "success",
                title: "we're can send answers successfully",
                msg: "check the console for more information",
                timer: 3,
                pos: "top-end",
              });
              console.log(json);
            }
          });
    }
  }
}

function CreateJSON(data) {
  data = JSON.stringify(data);
  const file = new Blob([data], { type: "application/json" });
  return URL.createObjectURL(file);
}
