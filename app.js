const $ = (s) => document.querySelector(s);

const MAX_DAILY = 3;
const TODAY_KEY = `udai-usage-${new Date().toISOString().slice(0, 10)}`;

let state = {
  audience: "",
  place: "",
  problem: "",
  idea: ""
};

function getUsage() {
  return Number(localStorage.getItem(TODAY_KEY) || 0);
}

function setUsage(n) {
  localStorage.setItem(TODAY_KEY, String(n));
  updateUsage();
}

function updateUsage() {
  $("#usedCount").textContent = getUsage();
  $("#generateBtn").disabled = getUsage() >= MAX_DAILY;
}

function selectOne(container, btn, key) {
  container.querySelectorAll("button").forEach((b) => {
    b.classList.remove("selected");
  });

  btn.classList.add("selected");
  state[key] = btn.dataset.value;
}

$("#audienceChoices").addEventListener("click", (e) => {
  const b = e.target.closest("button");

  if (!b) return;

  selectOne($("#audienceChoices"), b, "audience");
});

$("#placeChoices").addEventListener("click", (e) => {
  const b = e.target.closest("button");

  if (!b) return;

  selectOne($("#placeChoices"), b, "place");

  $("#customPlace").classList.toggle(
    "hidden",
    b.dataset.value !== "기타"
  );
});

[
  ["problem", "problemCount"],
  ["idea", "ideaCount"]
].forEach(([id, countId]) => {
  $("#" + id).addEventListener("input", (e) => {
    $("#" + countId).textContent = e.target.value.length;
  });
});


const bannedPatterns = [

  /전화번호|휴대폰|주민등록|집\s*주소|비밀번호|카톡\s*아이디/i,

  /\b01[016789][-\s]?\d{3,4}[-\s]?\d{4}\b/,

  /https?:\/\//i

];


function safeText(s) {

  return (
    s &&
    s.length <= 160 &&
    !bannedPatterns.some((r) => r.test(s))
  );

}


function validate() {

  state.problem = $("#problem").value.trim();

  state.idea = $("#idea").value.trim();


  if (state.place === "기타") {

    state.place = $("#customPlace").value.trim();

  }


  if (!state.audience) {

    return "누구를 위한 디자인인지 선택해 주세요.";

  }


  if (!state.place) {

    return "사용할 장소를 선택해 주세요.";

  }


  if (state.problem.length < 8) {

    return "불편한 점을 한 문장 이상 써 주세요.";

  }


  if (state.idea.length < 8) {

    return "만들고 싶은 디자인을 한 문장 이상 써 주세요.";

  }


  if (
    !safeText(state.problem) ||
    !safeText(state.idea)
  ) {

    return "개인정보나 인터넷 주소는 입력할 수 없어요.";

  }


  return "";

}



function audienceGuide(audience) {

  if (audience === "이주민·외국인") {

    return `

Audience-specific guidance:

- Prefer wayfinding, signs, icons, pictograms, color coding,
  simple symbols, and visual language support when relevant.

- Do NOT make immigrants or foreigners the visual subject.

- Do NOT create a portrait or group photo of people.

- If the student's idea is a sign or guide,
  show the SIGN or GUIDE as the main object,
  large and clearly designed.

`;

  }



  if (audience === "1인 가구") {

    return `

Audience-specific guidance:

- Focus on a concrete product, facility, service object,
  storage solution, safety feature,
  or easy-to-use shared-space design when relevant.

- Show how one person can use it easily and safely.

- Do NOT make a lone person or portrait the main subject.

`;

  }



  if (audience === "반려동물 가구") {

    return `

Audience-specific guidance:

- Focus on a concrete shared-space, furniture,
  facility, hygiene feature, safety feature,
  or pet-friendly public design when relevant.

- The design should help both pet households
  and other users share the space comfortably.

- Do NOT make a cute pet portrait the main subject.

`;

  }


  return "";

}



function buildPrompt() {

  const guide = audienceGuide(state.audience);


  return `

Create ONE clear UNIVERSAL DESIGN PROTOTYPE
based on an elementary school student's idea.


VERY IMPORTANT:

- The MAIN SUBJECT must be the DESIGN OBJECT,
  FACILITY, SIGN, PRODUCT, OR SPACE
  that solves the problem.

- The main design should occupy about 70-85%
  of the image.

- Do NOT make people the main subject.

- Do NOT create a portrait,
  group photo,
  fashion photo,
  documentary photo,
  or unrelated lifestyle scene.

- People may appear only as very small
  secondary figures to show how the design is used.

- Follow the student's actual idea.
  Do not replace it with a different solution.



Student design information:

Target user:
${state.audience}

Place:
${state.place}

Problem to solve:
${state.problem}

Student's proposed design:
${state.idea}



Task:

Turn the student's proposed design
into a visible, concrete prototype
or design concept.

Show exactly WHAT was designed
and HOW it solves the stated problem.

The final image should look like
a simple school design-presentation prototype,
not a photo of the target users.


${guide}


Visual requirements:

- clean product/design concept illustration

- simple, bright,
  classroom-friendly presentation

- clear front view or 3/4 view
  of the prototype

- useful details visible at a glance

- use pictograms, arrows,
  color coding, shapes,
  and symbols when helpful

- if text is needed,
  use only a few short labels

- the design must still be understandable
  without reading long text

- no random people

- no close-up faces

- no unrelated objects

- no logos or brands

- no violence
  or dangerous situations

- inclusive and respectful representation


The image must clearly answer this question:

"What universal design did the student create
to solve this problem?"

`;

}



function designTitle() {

  const who =

    state.audience === "이주민·외국인"

      ? "모두가 이해하는"

      : state.audience === "1인 가구"

      ? "혼자서도 편리한"

      : "함께 편안한";


  return `${who} ${state.place} 디자인`;

}



function showResult(imageDataUrl = null) {

  $("#studentView").classList.add("hidden");

  $("#resultView").classList.remove("hidden");


  const resultHeading = $("#resultView h2");

  if (resultHeading) {

    resultHeading.textContent =
      "우리 아이디어로 만든 디자인 시안";

  }


  $("#designName").textContent =
    designTitle();


  $("#summary").textContent =

`대상: ${state.audience}

장소: ${state.place}


우리가 해결하려는 불편함

${state.problem}


우리가 만들고 싶은 디자인

${state.idea}`;



  if (imageDataUrl) {

    $("#resultImage").src = imageDataUrl;

    $("#resultImage").classList.remove("hidden");

    $("#mockPlaceholder").classList.add("hidden");

  } else {

    $("#resultImage").classList.add("hidden");

    $("#mockPlaceholder").classList.remove("hidden");

  }


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}



async function generate() {

  $("#status").textContent = "";


  const msg = validate();


  if (msg) {

    $("#status").textContent = msg;

    return;

  }


  if (getUsage() >= MAX_DAILY) {

    $("#status").textContent =
      "오늘 만들 수 있는 횟수를 모두 사용했어요.";

    return;

  }


  const mock =
    localStorage.getItem("udai-mock") !== "false";


  const endpoint =
    localStorage.getItem("udai-endpoint") || "";


  $("#generateBtn").disabled = true;


  $("#generateBtn").textContent =
    "AI가 디자인 시안을 만들고 있어요…";


  try {


    if (mock || !endpoint) {


      await new Promise((r) =>
        setTimeout(r, 700)
      );


      setUsage(getUsage() + 1);


      showResult(null);


    } else {


      const res = await fetch(

        endpoint.replace(/\/$/, "") + "/generate",

        {

          method: "POST",

          headers: {

            "Content-Type": "application/json"

          },

          body: JSON.stringify({

            audience: state.audience,

            place: state.place,

            problem: state.problem,

            idea: state.idea,

            prompt: buildPrompt()

          })

        }

      );


      if (!res.ok) {

        const errorText =
          await res.text();


        console.error(
          "Worker error:",
          errorText
        );


        throw new Error(errorText);

      }


      const data =
        await res.json();


      if (!data.image) {

        throw new Error(
          "이미지 데이터가 없습니다."
        );

      }


      setUsage(
        getUsage() + 1
      );


      showResult(
        data.image
      );

    }


  } catch (err) {


    console.error(err);


    $("#status").textContent =
      "디자인 생성에 실패했어요. 선생님께 알려 주세요.";


  } finally {


    $("#generateBtn").textContent =
      "✨ AI로 디자인 만들기";


    updateUsage();

  }

}



$("#generateBtn").addEventListener(
  "click",
  generate
);



$("#backBtn").addEventListener(
  "click",
  () => {

    $("#resultView").classList.add("hidden");

    $("#studentView").classList.remove("hidden");

  }
);



$("#againBtn").addEventListener(
  "click",
  () => {

    $("#resultView").classList.add("hidden");

    $("#studentView").classList.remove("hidden");

    $("#generateBtn").click();

  }
);



$("#copyBtn").addEventListener(
  "click",
  async () => {

    await navigator.clipboard.writeText(
      $("#summary").textContent
    );


    $("#copyBtn").textContent =
      "✓ 복사했어요";


    setTimeout(() => {

      $("#copyBtn").textContent =
        "📋 설명 복사";

    }, 1200);

  }
);



$("#downloadBtn").addEventListener(
  "click",
  () => {

    const img =
      $("#resultImage");


    if (
      !img.src ||
      img.classList.contains("hidden")
    ) {

      alert(
        "미리보기 모드에서는 저장할 실제 이미지가 없어요."
      );

      return;

    }


    const a =
      document.createElement("a");


    a.href =
      img.src;


    a.download =
      "universal-design.png";


    a.click();

  }
);



function loadSettings() {

  $("#apiEndpoint").value =
    localStorage.getItem("udai-endpoint") || "";


  $("#mockMode").checked =
    localStorage.getItem("udai-mock") !== "false";

}



$("#saveSettings").addEventListener(
  "click",
  () => {

    localStorage.setItem(
      "udai-endpoint",
      $("#apiEndpoint").value.trim()
    );


    localStorage.setItem(
      "udai-mock",
      String(
        $("#mockMode").checked
      )
    );


    alert(
      "설정을 저장했습니다."
    );

  }
);



$("#resetUsage").addEventListener(
  "click",
  () => {

    setUsage(0);

    alert(
      "오늘 사용 횟수를 초기화했습니다."
    );

  }
);



function updatePageWording() {

  const headings =
    [...document.querySelectorAll(".step h2")];


  const ideaHeading =
    headings.find(
      (h) =>
        h.textContent.includes(
          "어떻게 바꾸고 싶나요?"
        )
    );


  if (ideaHeading) {

    ideaHeading.innerHTML =
      "<b>4</b> 어떤 디자인을 만들고 싶나요?";

  }


  if ($("#idea")) {

    $("#idea").placeholder =
      "예) 책 그림, 여러 나라 언어, 색깔 화살표가 있는 도서관 안내판을 만들고 싶어요.";

  }


  const resultHeading =
    $("#resultView h2");


  if (resultHeading) {

    resultHeading.textContent =
      "우리 아이디어로 만든 디자인 시안";

  }

}



loadSettings();

updateUsage();

updatePageWording();
