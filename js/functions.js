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

  between(
    from = +this.element.getAttribute("aria-valuemin") || 0,
    to = +this.element.getAttribute("aria-valuemax") || 10
  ) {
    const value = +this.element.value;

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
  questionsUrl: "",
  answersUrl: "",
  contentBox: "",
  question: 0,
};

export function getNextQuestion(
  attr = { index: data.question, function: () => {} }
) {
  const index = attr.index || data.question,
    func = attr.function || function () {},
    question = attr.index || data.question;

  fetch(data.questionsUrl)
    .then((response) => response.json())
    .then(({ questions }) => {
      if (questions[index]) {
        const { title, input } = questions[index],
          contentBox = data.contentBox;

        let AnswerInput,
          multi = false;

        $(".card-title").innerHTML = title;
        $("#question-index").innerHTML = question + 1;

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

        AnswerInput.name = "input-q" + (question + 1);

        fetch(data.answersUrl)
          .then((response) => response.json())
          .then(({ answers }) => {
            const answer = answers[index],
              feedback = [answer.true || "", answer.false || ""];

            if (!multi) {
              contentBox.appendChild(AnswerInput);
              AnswerInput.setAttribute(
                "data-example",
                Array.isArray(answer.options)
                  ? answer.options.join(",")
                  : answer.options
              );
              AnswerInput.placeholder = Array.isArray(answer.options)
                ? answer.options.join(",")
                : answer.options;
            } else {
              let parent = contentBox;
              if (AnswerInput.tagName.toLowerCase() == "select") {
                contentBox.appendChild(AnswerInput);
                parent = AnswerInput;
                AnswerInput = document.createElement("option");
              }

              answer.options.forEach((value, i) => {
                AnswerInput.value = value;

                const NewAnswerInput = document.createElement(
                  AnswerInput.tagName.toLowerCase()
                );

                if (parent != contentBox) {
                  AnswerInput.innerHTML = value;
                  parent.appendChild(AnswerInput);
                } else {
                  NewAnswerInput.setAttribute(
                    "type",
                    AnswerInput.getAttribute("type")
                  );

                  NewAnswerInput.classList.add("form-check-input");

                  NewAnswerInput.name = "input-q" + (question + 1);

                  AnswerInput.id = `input-q${question + 1}-${i + 1}`;

                  parent.appendChild(AnswerInput);

                  if (
                    AnswerInput.hasAttribute("type") &&
                    AnswerInput.getAttribute("type").search(
                      "radio" || "checkbox"
                    ) >= 0
                  ) {
                    const label = document.createElement("label");
                    label.classList.add("form-label");
                    label.innerHTML = value;
                    label.setAttribute(
                      "for",
                      `input-q${question + 1}-${i + 1}`
                    );

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

            ++data.question;

            func(
              title,
              typeof answer.correct != "boolean"
                ? Array.isArray(answer.options)
                  ? answer.options[answer.correct]
                  : answer.correct
                : null,
              answer.options,
              feedback,
              questions.length == index + 1,
              typeof answer.information != "boolean"
                ? false
                : answer.information
            );
          });
      }
    });
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
