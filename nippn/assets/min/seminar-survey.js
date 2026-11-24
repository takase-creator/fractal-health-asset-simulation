(function(){"use strict";if(document.getElementById("seminarSurvey"))return;const survey=document.createElement("section");survey.id="seminarSurvey",survey.className="panel seminar-survey",survey.setAttribute("aria-labelledby","surveyTitle"),survey.innerHTML=`<div class="ph"><span class="ph-step">STEP 5</span><span id="surveyTitle">アンケートに答える</span></div>
 <div class="pb"><p class="survey-lead">画面の使いやすさと、今後取り組みたいことを教えてください。全8問、選択式が中心です。必須は2問です。答えられる範囲でご回答ください。</p>
 <p class="survey-preview-note">確認用の画面です。回答は送信・保存されません。氏名・連絡先の入力はありません。</p>
 <form id="seminarSurveyForm">
 <div class="survey-field"><label for="surveyEase">1. シミュレーションの画面操作は分かりやすかったですか。<span class="survey-required">必須</span></label>
 <select id="surveyEase" name="ease" required><option value="">選んでください</option><option value="5">とても分かりやすかった</option><option value="4">分かりやすかった</option><option value="3">どちらともいえない</option><option value="2">やや分かりにくかった</option><option value="1">分かりにくかった</option></select></div>
 <div class="survey-field"><label for="surveyUnderstanding">2. 健診結果を受けて何をするか、具体的に考えられましたか。<span class="survey-required">必須</span></label>
 <select id="surveyUnderstanding" name="understanding" required><option value="">選んでください</option><option value="5">具体的に考えられた</option><option value="4">ある程度考えられた</option><option value="3">どちらともいえない</option><option value="2">あまり考えられなかった</option><option value="1">考えられなかった</option></select></div>
 <div class="survey-field"><label for="surveyResultClarity">3. 資産差額・健康年数の結果の読み方は分かりましたか。<span class="survey-optional">任意</span></label>
 <select id="surveyResultClarity" name="resultClarity"><option value="">選んでください</option><option value="5">よく分かった</option><option value="4">ある程度分かった</option><option value="3">どちらともいえない</option><option value="2">あまり分からなかった</option><option value="1">分からなかった</option><option value="not_viewed">結果をまだ見ていない</option></select></div>
 <div class="survey-field"><label for="surveyAwareness">4. 利用前と比べて、生活習慣を見直す気持ちは変わりましたか。<span class="survey-optional">任意</span></label>
 <select id="surveyAwareness" name="awareness"><option value="">選んでください</option><option value="increased">以前より見直したいと思う</option><option value="already">以前から見直したいと思っており、変わらない</option><option value="maintain">今の習慣を続けたいと思う</option><option value="unchanged">特に変わらない</option><option value="unsure">まだ分からない</option></select></div>
 <fieldset class="survey-field survey-actions"><legend>5. これから取り組んでみたいことを教えてください。<span class="survey-optional">任意・複数選択可</span></legend>
 <div class="survey-options">
 <label><input type="checkbox" name="actions" value="exercise">運動習慣を見直す</label>
 <label><input type="checkbox" name="actions" value="food">食事を見直す</label>
 <label><input type="checkbox" name="actions" value="sleep">睡眠を整える</label>
 <label><input type="checkbox" name="actions" value="checkup">健診票の判定・受診案内を確認する</label>
 <label><input type="checkbox" name="actions" value="continue">今の取り組みを続ける</label>
 <label><input type="checkbox" name="actions" value="undecided">まだ決めていない</label>
 </div></fieldset>
 <div class="survey-field"><label for="surveyStart">6. 選んだ取り組みは、いつから始めたいですか。<span class="survey-optional">任意</span></label>
 <select id="surveyStart" name="start"><option value="">選んでください</option><option value="week">1週間以内</option><option value="month">1か月以内</option><option value="later">1か月より先</option><option value="continuing">すでに取り組んでいるので続けたい</option><option value="undecided">まだ決めていない</option><option value="none">今のところ始める予定はない</option></select></div>
 <fieldset class="survey-field"><legend>7. 続けるために、どんな機会・サポートがあるとよいですか。<span class="survey-optional">任意・複数選択可</span></legend>
 <div class="survey-options">
 <label><input type="checkbox" name="support" value="gym">社内のジム利用補助・運動施設の案内</label>
 <label><input type="checkbox" name="support" value="online">自宅や職場で参加できるオンライン運動</label>
 <label><input type="checkbox" name="support" value="events">ウォーキングなど、同僚と参加できる企画</label>
 <label><input type="checkbox" name="support" value="advice">運動・食事について専門職へ相談する機会</label>
 <label><input type="checkbox" name="support" value="checkup">健診後の受診・保健指導の案内</label>
 <label><input type="checkbox" name="support" value="time">仕事の合間に取り組める時間・場所</label>
 <label><input type="checkbox" name="support" value="none">特に必要ない</label>
 <label><input type="checkbox" name="support" value="undecided">まだ分からない</label>
 </div></fieldset>
 <div class="survey-field"><label for="surveyComment">8. 分かりにくかった点や、ご意見があれば教えてください。<span class="survey-optional">任意</span></label>
 <textarea id="surveyComment" name="comment" maxlength="300" rows="3" aria-describedby="surveyCommentHelp surveyCounter"></textarea>
 <div class="survey-comment-help"><span id="surveyCommentHelp">300文字まで。個人を特定する情報や、詳しい健康情報は記入しないでください。</span><span id="surveyCounter">0 / 300</span></div></div>
 <button type="submit" class="survey-confirm-button">回答内容を確認する</button>
 </form>
 <section id="surveyConfirmation" class="survey-confirmation" aria-labelledby="surveyConfirmationTitle" hidden>
 <h3 id="surveyConfirmationTitle" tabindex="-1">回答内容の確認</h3><dl id="surveyAnswerSummary"></dl>
 <p>この画面は確認用です。回答の送信・保存は行っていません。</p><button type="button" id="surveyBack">入力に戻る</button>
 </section></div>`;const nextPlan=document.getElementById("nextPlan");if((nextPlan||document.getElementById("p1")).after(survey),document.body.classList.add("has-seminar-survey"),nextPlan&&!document.getElementById("surveyStepLink")){const link=document.createElement("a");link.id="surveyStepLink",link.className="survey-step-link",link.href="#seminarSurvey",link.textContent="STEP 5 アンケートへ進む",nextPlan.querySelector(".next-plan-head").append(link)}window.dispatchEvent(new Event("scroll"));const form=document.getElementById("seminarSurveyForm"),confirmation=document.getElementById("surveyConfirmation"),actions=[...form.querySelectorAll('[name="actions"]')];actions.forEach(el=>el.addEventListener("change",()=>{el.checked&&(el.value==="undecided"?actions.filter(other=>other!==el).forEach(other=>other.checked=!1):actions.find(other=>other.value==="undecided").checked=!1)}));const support=[...form.querySelectorAll('[name="support"]')];support.forEach(el=>el.addEventListener("change",()=>{if(!el.checked)return;const exclusive=["none","undecided"];support.filter(other=>other!==el&&(exclusive.includes(el.value)||exclusive.includes(other.value))).forEach(other=>other.checked=!1)})),document.getElementById("surveyComment").addEventListener("input",event=>{document.getElementById("surveyCounter").textContent=event.target.value.length+" / 300"}),form.addEventListener("submit",event=>{if(event.preventDefault(),!form.reportValidity())return;const ease=document.getElementById("surveyEase"),understanding=document.getElementById("surveyUnderstanding"),selectedActions=actions.filter(el=>el.checked).map(el=>el.closest("label").textContent.trim()),choice=id=>{const el=document.getElementById(id);return el.value?el.selectedOptions[0].textContent:"回答なし"},pairs=[["1. 画面操作の分かりやすさ",ease.selectedOptions[0].textContent],["2. 健診後の行動の具体化",understanding.selectedOptions[0].textContent],["3. 結果の読み方",choice("surveyResultClarity")],["4. 生活習慣を見直す気持ちの変化",choice("surveyAwareness")],["5. 取り組んでみたいこと",selectedActions.join(" ／ ")||"回答なし"],["6. 取り組みを始める時期",choice("surveyStart")],["7. 希望する機会・サポート",support.filter(el=>el.checked).map(el=>el.closest("label").textContent.trim()).join(" ／ ")||"回答なし"],["8. ご意見",document.getElementById("surveyComment").value.trim()||"回答なし"]],summary=document.getElementById("surveyAnswerSummary");summary.replaceChildren();for(const[question,answer]of pairs){const dt=document.createElement("dt");dt.textContent=question;const dd=document.createElement("dd");dd.textContent=answer,summary.append(dt,dd)}form.hidden=!0,confirmation.hidden=!1,document.getElementById("surveyConfirmationTitle").focus()}),document.getElementById("surveyBack").addEventListener("click",()=>{confirmation.hidden=!0,form.hidden=!1,document.getElementById("surveyEase").focus()}),document.getElementById("resetFormBtn").addEventListener("click",()=>{form.reset(),confirmation.hidden=!0,form.hidden=!1,document.getElementById("surveyAnswerSummary").replaceChildren(),document.getElementById("surveyCounter").textContent="0 / 300"})})();
