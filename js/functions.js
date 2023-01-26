export const $ = (
  qr,
  filter = (result) => {
    return result;
  }
) => {
  const select = document.querySelectorAll(qr),
    result =
      select.length > 0 ? (select.length == 1 ? select[0] : select) : undefined;

  if (typeof filter == "function") return filter(result);
};

export class validateForm {
  constructor(form) {
    this.mistakes = [];
    this.check = [];

    Array.from(form).forEach((element) => {
      element.setCustomValidity("");
      this.element = element;
      const tagname = element.tagName.toLowerCase();

      if (tagname != "button" && !this.checked()) {
        this.useAttribute();

        if (tagname == "select") {
          this.notDefault(element.querySelector("option[data-default]"));
        } else if (tagname == "textarea") {
          this.notEmpty();
        } else if (tagname == "input") {
          const CheckRadQuery = `${tagname}[name=${element.name}]`;

          switch (element.getAttribute("type")) {
            case "checkbox":
              this.notEmpty(form.querySelectorAll(CheckRadQuery));
              this.notDefault(form.querySelectorAll(CheckRadQuery));
              break;

            case "radio":
              this.notEmpty(form.querySelectorAll(CheckRadQuery));
              this.notDefault(form.querySelectorAll(CheckRadQuery));
              break;

            case "text":
              this.notEmpty();
              break;

            case "number":
              this.between();
              this.notEmpty();
              break;

            case "email":
              this.notExample(
                element.getAttribute("data-example") || "example@"
              );
              this.doNotHaveSpace();
              this.notEmpty();
              break;

            case "password":
              this.notRepeat();
              this.doNotHaveSpace();
              this.notEmpty();
              break;

            default:
              this.notEmpty();
              break;
          }
        }
      }
    });

    this.isValid();

    if (this.mistakes.length == 0) this.validate = true;
    else this.validate = false;
  }

  isValid() {
    this.mistakes.forEach((elements) => {
      elements.for.forEach((element) => {
        this.check.forEach((el) => {
          if (el == element) {
            el.setCustomValidity(elements.message);
          }
        });
      });
    });
  }

  checked(element = this.element) {
    let counter = 0;

    while (counter < this.check.length) {
      if (this.check[counter] == element) {
        return true;
      }

      counter++;
    }

    return false;
  }

  notDefault(values = this.element, attr = "data-default") {
    if (values != null) {
      if (!values[0]) values = [values];

      const elements = [];
      let checked = false;

      values.forEach((el) => {
        elements.push(el);

        if (el.tagName.toLowerCase() != "option") this.check.push(el);
        else if (!checked) {
          this.check.push(this.element);
          checked = true;
        }

        if (
          el.hasAttribute(attr) &&
          (el.checked || (this.element != el && this.element.value == el.value))
        ) {
          let used = elements;

          if (this.element.tagName == "SELECT") used = [this.element];

          this.mistakes.push({
            status: false,
            for: used,
            message: "is default",
          });
        }
      });
    }
  }

  notEmpty(element = this.element) {
    let value;

    if (
      element[0] ||
      (!element[0] &&
        element.getAttribute("type") &&
        element.getAttribute("type").search("checkbox" || "radio") >= 0)
    ) {
      let check = false,
        elements = [];

      element.forEach((el) => {
        if (el.checked) {
          check = true;
        }

        elements.push(el);
      });

      if (!check) {
        if (this.element.tagName.toLowerCase() == "select") {
          this.check.push(element);
        }

        this.mistakes.push({
          status: false,
          for: elements,
          message: "is empty",
        });
      }
    } else {
      value = element.value.trim();

      this.check.push(element);

      if (value == "")
        this.mistakes.push({
          status: false,
          for: [this.element],
          message: "is empty",
        });
    }
  }

  between(from = +this.element.min, to = +this.element.max) {
    const value = +this.element.value;

    if (!from) from = value - 1;
    if (!to) to = value + 1;
    if (value <= from && value > to) {
      this.mistakes.push({
        status: false,
        for: [this.element],
        message: `value isn't between ${from} and ${to}\nthat's : ${value}`,
      });
    }
  }

  notExample(example = this.element.getAttribute("data-example")) {
    const value = this.element.value;

    if (typeof example != "string" && example[0]) {
      example.forEach((ex) => {
        if (value == ex) {
          this.mistakes.push({
            status: false,
            for: [this.element],
            message: `like example "${ex}"`,
          });

          return "";
        }
      });
    } else {
      if (value == example) {
        this.mistakes.push({
          status: false,
          for: [this.element],
          message: `like example "${example}"`,
        });
      }
    }
  }

  notRepeat(maxCheck = 3) {
    const value = this.element.value;
    let repeatVal = value;

    for (let i = 0; i < maxCheck; i++) {
      const charecter = value[i];
      if (repeatVal.trim() != "") {
        repeatVal = repeatVal.replace(new RegExp(charecter, "g"), "");
      }
    }

    if (repeatVal.trim() == "") {
      this.mistakes.push({
        status: false,
        for: [this.element],
        message: `you repeat first ${maxCheck} charecters`,
      });
    }
  }

  doNotHaveSpace() {
    const value = this.element.value;
    if (value.search(" ") != -1) {
      this.mistakes.push({
        status: false,
        for: [this.element],
        message: `you should not have space in your text`,
      });
    }
  }

  useAttribute() {
    if (this.element.hasAttribute("data-example")) {
      this.notExample(this.element.getAttribute("data-example").split(","));
    }

    if (
      this.element.hasAttribute("aria-valuemax") ||
      this.element.hasAttribute("aria-valuemin")
    ) {
      this.between();
    }

    if (this.element.hasAttribute("data-repeat")) {
      this.notRepeat(this.element.getAttribute("data-repeat"));
    }

    if (this.element.hasAttribute("data-nospace")) {
      this.doNotHaveSpace();
    }
  }
}

/*
    [select , radio , checkbox] != default
    number < aria-min
    number >= aria-max
    [text , password].trim() != ""
    [text , password] != repeat one charecter    
    email != example
*/

export const data = {
  MainUrl: "",
  questions: [],
  answers: [],
  contentBox: "",
  index: 0,
  LoadQuestions: async (url) => {
    data.MainUrl = url;
    fetch(url.replace("%NAME%", "questions"))
      .then((response) => response.json())
      .then(({ questions }) => {
        data.questions = questions;
      })
      .catch((e) => {
        console.error(e);
      });

    fetch(url.replace("%NAME%", "answers"))
      .then((response) => response.json())
      .then(({ answers }) => {
        data.answers = answers;
      })
      .catch((e) => {
        console.error(e);
      });

    data.LoadQuestions = undefined;
  },
};

export function getNextQuestion(
  attr = { index: data.index, function: () => {} }
) {
  const index = attr.index || data.index,
    func = attr.function || function () {},
    { questions } = data;

  if (questions[index]) {
    const { title, input } = questions[index],
      contentBox = data.contentBox;

    let AnswerInput,
      multi = false;

    $(".card-title").innerHTML = title;
    $(".card-subtitle").innerHTML = "question " + index + 1;

    switch (input) {
      case "select":
        AnswerInput = document.createElement("select");
        AnswerInput.classList.add("form-select");
        multi = true;
        break;

      case "textarea":
        AnswerInput = document.createElement("textarea");
        AnswerInput.classList.add("form-control");
        break;

      default:
        AnswerInput = document.createElement("input");
        AnswerInput.type = input;
        break;
    }

    if (input == "checkbox" || input == "radio") {
      AnswerInput.classList.add("form-check-input");
      multi = true;
    } else if (input != "select") {
      AnswerInput.classList.add("form-control");
    }

    AnswerInput.name = "input-q" + (index + 1);

    const answer = data.answers[index];
    const feedback = [answer.true || "", answer.false || ""];

    if (!multi) {
      contentBox.appendChild(AnswerInput);

      if (typeof answer.correct !== "object") {
        AnswerInput.setAttribute(
          "data-example",
          Array.isArray(answer.options)
            ? answer.options.join(", ").trim()
            : answer.options
        );
        AnswerInput.placeholder = Array.isArray(answer.options)
          ? answer.options.join(", ").trim()
          : answer.options;
      } else {
        if ((AnswerInput.type === "number", "range")) {
          AnswerInput.value = answer.correct.min | 0;
          AnswerInput.min = answer.correct.min | 0;
          AnswerInput.max = answer.correct.max | 100;
          AnswerInput.step = answer.correct.step | 1;
        }

        if (AnswerInput.type === "range") {
          const output = document.createElement("output");
          output.value = AnswerInput.value;
          output.classList.add(
            "text-bg-primary",
            "p-1",
            "text-center",
            "rounded-pill"
          );
          AnswerInput.oninput = ({ target }) => {
            output.value = target.value;
            document.body.scrollWidth;

            const precent =
              (AnswerInput.value - AnswerInput.min) /
              (AnswerInput.max - AnswerInput.min + 3);

            document.body.scrollLeft;
            output.style.left = `calc(${precent * 100}% - ${precent * 1.5}em)`;
          };
          contentBox.appendChild(output);
        }
      }
    } else {
      let parent = contentBox;
      if (AnswerInput.tagName.toLowerCase() == "select") {
        contentBox.appendChild(AnswerInput);
        parent = AnswerInput;
        AnswerInput = document.createElement("option");
      }

      randomize(answer.options).forEach((value, i) => {
        AnswerInput.value = value;

        const NewAnswerInput = document.createElement(
          AnswerInput.tagName.toLowerCase()
        );

        if (parent != contentBox) {
          AnswerInput.innerHTML = value;
          parent.appendChild(AnswerInput);
        } else {
          NewAnswerInput.setAttribute("type", AnswerInput.getAttribute("type"));

          NewAnswerInput.classList.add("form-check-input");

          NewAnswerInput.name = "input-q" + (index + 1);

          AnswerInput.id = `input-q${index + 1}-${i + 1}`;

          parent.appendChild(AnswerInput);

          if (
            AnswerInput.hasAttribute("type") &&
            AnswerInput.getAttribute("type").search("radio" || "checkbox") >= 0
          ) {
            const label = document.createElement("label");
            label.classList.add("form-label");
            label.innerHTML = value;
            label.setAttribute("for", `input-q${index + 1}-${i + 1}`);

            parent.appendChild(label);
          }
        }

        AnswerInput = NewAnswerInput;
      });
    }

    if (typeof answer.correct == "number" || answer.correct != false) {
      const element = document.createElement("span");
      element.innerText = answer.error;
      contentBox.appendChild(element);

      element.classList.add("invalid-feedback");
    }

    ++data.index;

    const correct =
      typeof answer.correct == "object"
        ? answer.correct.answer || answer.correct
        : Array.isArray(answer.options)
        ? typeof answer.correct == "number"
          ? answer.options[answer.correct]
          : answer.correct
        : answer.correct || null;

    func(
      title,
      correct,
      answer.options,
      feedback,
      questions.length == index + 1,
      Boolean(answer.information)
    );
  }
}

export function allIsInfo(answers) {
  const informations = [];

  answers.forEach((answer, i) => {
    if (answer.information == true) {
      informations.push(i);
    }
  });

  return informations.length == answers.length;
}

function randomize(array) {
  const NewArray = [],
    pushed = [];

  array.forEach(() => {
    const num = random(pushed, array.length);
    pushed.push(num);
    NewArray.push(array[num]);
  });

  return NewArray;
}

function random(not, length) {
  const number = Math.floor(Math.random() * length);
  return !not.includes(number) ? number : random(not, length);
}

export function message(prop) {
  const Toast = Swal.mixin({
    toast: true,
    position: prop.pos,
    showConfirmButton: false,
    timer: prop.timer * 1000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  Toast.fire({
    icon: prop.icon,
    title: prop.title,
    text: prop.msg,
  });
}
