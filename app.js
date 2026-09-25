const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const MAX_DAILY = 3;
const TODAY_KEY = `udai-usage-${new Date().toISOString().slice(0,10)}`;

let state = { audience:"", place:"", problem:"", idea:"" };

function getUsage(){ return Number(localStorage.getItem(TODAY_KEY) || 0); }
function setUsage(n){ localStorage.setItem(TODAY_KEY, String(n)); updateUsage(); }
function updateUsage(){
  $("#usedCount").textContent = getUsage();
  $("#generateBtn").disabled = getUsage() >= MAX_DAILY;
}
function selectOne(container, btn, key){
  container.querySelectorAll("button").forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
  state[key] = btn.dataset.value;
}
$("#audienceChoices").addEventListener("click", e=>{
  const b=e.target.closest("button"); if(!b)return;
  selectOne($("#audienceChoices"), b, "audience");
});
$("#placeChoices").addEventListener("click", e=>{
  const b=e.target.closest("button"); if(!b)return;
  selectOne($("#placeChoices"), b, "place");
  $("#customPlace").classList.toggle("hidden", b.dataset.value!=="기타");
});

[["problem","problemCount"],["idea","ideaCount"]].forEach(([id,c])=>{
  $("#"+id).addEventListener("input",e=>$("#"+c).textContent=e.target.value.length);
});

const bannedPatterns = [
  /전화번호|휴대폰|주민등록|집\s*주소|비밀번호|카톡\s*아이디/i,
  /\b01[016789][-\s]?\d{3,4}[-\s]?\d{4}\b/,
  /https?:\/\//i
];
function safeText(s){
  return s && s.length <= 160 && !bannedPatterns.some(r=>r.test(s));
}
function validate(){
  state.problem=$("#problem").value.trim();
  state.idea=$("#idea").value.trim();
  if(state.place==="기타") state.place=$("#customPlace").value.trim();
  if(!state.audience) return "누구를 위한 디자인인지 선택해 주세요.";
  if(!state.place) return "사용할 장소를 선택해 주세요.";
  if(state.problem.length < 8) return "불편한 점을 한 문장 이상 써 주세요.";
  if(state.idea.length < 8) return "어떻게 바꾸고 싶은지 한 문장 이상 써 주세요.";
  if(!safeText(state.problem)||!safeText(state.idea)) return "개인정보나 인터넷 주소는 입력할 수 없어요.";
  return "";
}

function buildPrompt(){
  return `초등학교 3학년 사회·예술 융합수업용 유니버설 디자인 아이디어를 한 장의 명확한 제품/공간 콘셉트 이미지로 표현한다.
대상: ${state.audience}
장소: ${state.place}
불편함: ${state.problem}
학생의 해결 아이디어: ${state.idea}
조건:
- 어린이가 이해하기 쉬운 밝고 단순한 교육용 일러스트
- 해결 아이디어가 이미지에서 분명하게 보이도록 한다
- 사람을 차별적으로 묘사하지 않는다
- 실존 인물, 브랜드, 로고를 넣지 않는다
- 과도한 글자는 넣지 않는다
- 폭력적이거나 위험한 장면은 넣지 않는다
- 유니버설 디자인의 핵심인 '누구나 쉽고 편리하게 이용'이 드러나게 한다`;
}

function designTitle(){
  const who = state.audience==="이주민·외국인" ? "모두가 이해하는" :
              state.audience==="1인 가구" ? "혼자서도 편리한" : "함께 편안한";
  return `${who} ${state.place} 디자인`;
}
function showResult(imageDataUrl=null){
  $("#studentView").classList.add("hidden");
  $("#resultView").classList.remove("hidden");
  $("#designName").textContent=designTitle();
  $("#summary").textContent=`대상: ${state.audience}
장소: ${state.place}

불편함
${state.problem}

우리의 해결 아이디어
${state.idea}`;
  if(imageDataUrl){
    $("#resultImage").src=imageDataUrl;
    $("#resultImage").classList.remove("hidden");
    $("#mockPlaceholder").classList.add("hidden");
  }else{
    $("#resultImage").classList.add("hidden");
    $("#mockPlaceholder").classList.remove("hidden");
  }
  window.scrollTo({top:0,behavior:"smooth"});
}

async function generate(){
  $("#status").textContent="";
  const msg=validate();
  if(msg){ $("#status").textContent=msg; return; }
  if(getUsage()>=MAX_DAILY){ $("#status").textContent="오늘 만들 수 있는 횟수를 모두 사용했어요."; return; }

  const mock = localStorage.getItem("udai-mock") !== "false";
  const endpoint = localStorage.getItem("udai-endpoint") || "";
  $("#generateBtn").disabled=true;
  $("#generateBtn").textContent="AI가 디자인을 생각하고 있어요…";

  try{
    if(mock || !endpoint){
      await new Promise(r=>setTimeout(r,700));
      setUsage(getUsage()+1);
      showResult(null);
    }else{
      const res=await fetch(endpoint.replace(/\/$/,"")+"/generate",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          audience:state.audience,place:state.place,
          problem:state.problem,idea:state.idea,prompt:buildPrompt()
        })
      });
      if(!res.ok) throw new Error(await res.text());
      const data=await res.json();
      if(!data.image) throw new Error("이미지 데이터가 없습니다.");
      setUsage(getUsage()+1);
      showResult(data.image);
    }
  }catch(err){
    console.error(err);
    $("#status").textContent="디자인 생성에 실패했어요. 선생님께 알려 주세요.";
  }finally{
    $("#generateBtn").textContent="✨ AI로 디자인 만들기";
    updateUsage();
  }
}
$("#generateBtn").addEventListener("click",generate);
$("#backBtn").addEventListener("click",()=>{$("#resultView").classList.add("hidden");$("#studentView").classList.remove("hidden");});
$("#againBtn").addEventListener("click",()=>{$("#resultView").classList.add("hidden");$("#studentView").classList.remove("hidden");$("#generateBtn").click();});
$("#copyBtn").addEventListener("click",async()=>{await navigator.clipboard.writeText($("#summary").textContent);$("#copyBtn").textContent="✓ 복사했어요";setTimeout(()=>$("#copyBtn").textContent="📋 설명 복사",1200);});
$("#downloadBtn").addEventListener("click",()=>{
  const img=$("#resultImage");
  if(!img.src || img.classList.contains("hidden")){alert("미리보기 모드에서는 저장할 실제 이미지가 없어요.");return;}
  const a=document.createElement("a");a.href=img.src;a.download="universal-design.png";a.click();
});

function loadSettings(){
  $("#apiEndpoint").value=localStorage.getItem("udai-endpoint")||"";
  $("#mockMode").checked=localStorage.getItem("udai-mock")!=="false";
}
$("#saveSettings").addEventListener("click",()=>{
  localStorage.setItem("udai-endpoint",$("#apiEndpoint").value.trim());
  localStorage.setItem("udai-mock",String($("#mockMode").checked));
  alert("설정을 저장했습니다.");
});
$("#resetUsage").addEventListener("click",()=>{setUsage(0);alert("오늘 사용 횟수를 초기화했습니다.");});
loadSettings();updateUsage();
