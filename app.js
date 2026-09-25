const $ = (s) => document.querySelector(s);

const MAX_DAILY = 3;
const TODAY_KEY = `udai-usage-${new Date().toISOString().slice(0, 10)}`;

// 학생 기기에서도 바로 작동하도록 기본 Worker 주소 지정
const DEFAULT_ENDPOINT =
  "https://universal-design-ai-api.win2661.workers.dev";

const DEFAULT_MOCK_MODE = false;

let state = {
  audience: "",
  place: "",
  problem: "",
  idea: ""
};


// ------------------------------
// 사용 횟수
// ------------------------------

function getUsage() {
  return Number(localStorage.getItem(TODAY_KEY) || 0);
}

function setUsage(n) {
  localStorage.setItem(TODAY_KEY, String(n));
  updateUsage();
}

function updateUsage() {
  $("#usedCount").textContent = getUsage();

  $("#generateBtn").disabled =
    getUsage() >= MAX_DAILY;
}


// ------------------------------
// 1. 대상 선택
// ------------------------------

const audienceButtons =
  document.querySelectorAll("#audienceChoices .choice");

audienceButtons.forEach((button) => {

  button.addEventListener("click", (e) => {

    e.preventDefault();

    // 대상 버튼끼리만 선택 해제
    audienceButtons.forEach((b) => {
      b.classList.remove("selected");
      b.setAttribute("aria-pressed", "false");
    });

    button.classList.add("selected");
    button.setAttribute("aria-pressed", "true");

    state.audience =
      button.dataset.value;

  });

});


// ------------------------------
// 2. 장소 선택
// ------------------------------

const placeButtons =
  document.querySelectorAll("#placeChoices .pill");

placeButtons.forEach((button) => {

  button.addEventListener("click", (e) => {

    e.preventDefault();

    // 장소 버튼끼리만 선택 해제
    placeButtons.forEach((b) => {
      b.classList.remove("selected");
      b.setAttribute("aria-pressed", "false");
    });

    button.classList.add("selected");
    button.setAttribute("aria-pressed", "true");

    state.place =
      button.dataset.value;

    // 기타 선택 시 직접 입력창 표시
    $("#customPlace").classList.toggle(
      "hidden",
      button.dataset.value !== "기타"
    );

  });

});


// ------------------------------
// 글자 수 표시
// ------------------------------

[
  ["problem", "problemCount"],
  ["idea", "ideaCount"]
].forEach(([id, countId]) => {

  $("#" + id).addEventListener(
    "input",
    (e) => {

      $("#" + countId).textContent =
        e.target.value.length;

    }
  );

});


// ------------------------------
// 개인정보 입력 방지
// ------------------------------

const bannedPatterns = [

  /전화번호|휴대폰|주민등록|집\s*주소|비밀번호|카톡\s*아이디/i,

  /\b01[016789][-\s]?\d{3,4}[-\s]?\d{4}\b/,

  /https?:\/\//i

];

function safeText(s) {

  return (
    s &&
    s.length <= 160 &&
    !bannedPatterns.some(
      (pattern) => pattern.test(s)
    )
  );

}


// ------------------------------
// 입력 확인
// ------------------------------

function validate() {

  state.problem =
    $("#problem").value.trim();

  state.idea =
    $("#idea").value.trim();


  if (state.place === "기타") {

    state.place =
      $("#customPlace").value.trim();

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


// ------------------------------
// 디자인 이름
// ------------------------------

function designTitle() {

  if (state.audience === "이주민·외국인") {

    return `모두가 이해하는 ${state.place} 디자인`;

  }


  if (state.audience === "1인 가구") {

    return `혼자서도 편리한 ${state.place} 디자인`;

  }


  return `함께 편안한 ${state.place} 디자인`;

}


// ------------------------------
// 결과 화면
// ------------------------------

function showResult(imageDataUrl) {

  $("#studentView").classList.add("hidden");

  $("#resultView").classList.remove("hidden");


  const resultHeading =
    $("#resultView h2");

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

    $("#resultImage").src =
      imageDataUrl;

    $("#resultImage").classList.remove(
      "hidden"
    );

    $("#mockPlaceholder").classList.add(
      "hidden"
    );

  } else {

    $("#resultImage").classList.add(
      "hidden"
    );

    $("#mockPlaceholder").classList.remove(
      "hidden"
    );

  }


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


// ------------------------------
// AI 디자인 생성
// ------------------------------

async function generate() {

  $("#status").textContent = "";


  const validationMessage =
    validate();


  if (validationMessage) {

    $("#status").textContent =
      validationMessage;

    return;

  }


  if (getUsage() >= MAX_DAILY) {

    $("#status").textContent =
      "오늘 만들 수 있는 횟수를 모두 사용했어요.";

    return;

  }


  const savedMock =
    localStorage.getItem("udai-mock");

  const mock =
    savedMock === null
      ? DEFAULT_MOCK_MODE
      : savedMock === "true";


  const endpoint =
    localStorage.getItem(
      "udai-endpoint"
    ) || DEFAULT_ENDPOINT;


  $("#generateBtn").disabled = true;

  $("#generateBtn").textContent =
    "AI가 디자인 시안을 만들고 있어요…";


  try {

    if (mock) {

      await new Promise(
        (resolve) =>
          setTimeout(resolve, 600)
      );

      showResult(null);

      return;

    }


    const response =
      await fetch(

        endpoint.replace(/\/$/, "") +
          "/generate",

        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          // Cloudflare Worker에서
          // 프롬프트를 직접 만듦
          body: JSON.stringify({

            audience: state.audience,

            place: state.place,

            problem: state.problem,

            idea: state.idea

          })

        }

      );


    if (!response.ok) {

      const errorText =
        await response.text();

      console.error(
        "Worker error:",
        errorText
      );

      throw new Error(
        errorText
      );

    }


    const data =
      await response.json();


    if (!data.image) {

      throw new Error(
        "이미지 데이터가 없습니다."
      );

    }


    // 성공했을 때만 사용 횟수 증가
    setUsage(
      getUsage() + 1
    );


    showResult(
      data.image
    );


  } catch (error) {

    console.error(error);

    $("#status").textContent =
      "디자인 생성에 실패했어요. 선생님께 알려 주세요.";


  } finally {

    $("#generateBtn").textContent =
      "✨ AI로 디자인 만들기";

    updateUsage();

  }

}


// ------------------------------
// 버튼
// ------------------------------

$("#generateBtn").addEventListener(
  "click",
  (e) => {

    e.preventDefault();

    generate();

  }
);


$("#backBtn").addEventListener(
  "click",
  () => {

    $("#resultView").classList.add(
      "hidden"
    );

    $("#studentView").classList.remove(
      "hidden"
    );

  }
);


$("#againBtn").addEventListener(
  "click",
  () => {

    $("#resultView").classList.add(
      "hidden"
    );

    $("#studentView").classList.remove(
      "hidden"
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }
);


$("#copyBtn").addEventListener(
  "click",
  async () => {

    try {

      await navigator.clipboard.writeText(
        $("#summary").textContent
      );

      $("#copyBtn").textContent =
        "✓ 복사했어요";

      setTimeout(() => {

        $("#copyBtn").textContent =
          "📋 설명 복사";

      }, 1200);

    } catch {

      alert(
        "복사할 수 없습니다."
      );

    }

  }
);


$("#downloadBtn").addEventListener(
  "click",
  () => {

    const image =
      $("#resultImage");


    if (
      !image.src ||
      image.classList.contains(
        "hidden"
      )
    ) {

      alert(
        "저장할 이미지가 없습니다."
      );

      return;

    }


    const link =
      document.createElement("a");

    link.href =
      image.src;

    link.download =
      "universal-design.png";

    link.click();

  }
);


// ------------------------------
// 교사용 설정
// ------------------------------

function loadSettings() {

  $("#apiEndpoint").value =
    localStorage.getItem(
      "udai-endpoint"
    ) || DEFAULT_ENDPOINT;


  const savedMock =
    localStorage.getItem(
      "udai-mock"
    );


  $("#mockMode").checked =
    savedMock === null
      ? DEFAULT_MOCK_MODE
      : savedMock === "true";

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


// ------------------------------
// 화면 문구
// ------------------------------

function updatePageWording() {

  const headings =
    [
      ...document.querySelectorAll(
        ".step h2"
      )
    ];


  const ideaHeading =
    headings.find(
      (heading) =>
        heading.textContent.includes(
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


// ------------------------------
// 시작
// ------------------------------

loadSettings();

updateUsage();

updatePageWording();
