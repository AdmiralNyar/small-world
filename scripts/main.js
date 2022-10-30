const ORIGINAL_FONT_LIST = [
    {name: "Voynich", key: "small-world-font-Voynich"}, 
    {name: "Madrona", key: "small-world-font-Madrona"}, 
    {name: "Evoken", key: "small-world-font-Evoken"},
    {name: "Gavelk", key: "small-world-font-Gavelk"},
    {name: "OldGavelk", key: "small-world-font-OldGavelk"},
    {name: "Divinish", key: "small-world-font-Divinish"},
    {name: "Grasstext", key: "small-world-font-Grasstext"},
    {name: "Reptilian", key: "small-world-font-Reptilian"},
    {name: "Kushudian", key: "small-world-font-Kushudian"},
    {name: "thaumatology", key: "small-world-font-thaumatology"},
    {name: "UltraCode", key: "small-world-font-UltraCode"},
    {name: "RlyehRunes", key: "small-world-font-RlyehRunes"}
]
String.prototype.bytes = function () {
    return(encodeURIComponent(this).replace(/%../g,"x").length);
}

var isNewVersion = isNewerVersion(game.version, "10");

Hooks.once("init", async function(){
    isNewVersion = isNewerVersion(game.version, "10");

    game.settings.register("small-world", "transnow",{
        name:"translate now",
        scope: "client",
        config:false,
        type:Boolean,
        default:false
    });
    game.settings.register("small-world", "translateType",{
        name: "Translate type",
        scope: "client",
        config: false,
        default: 0,
        type:Number
    });
    game.settings.register("small-world", "translateActivate",{
        name: "Web translate activate",
        scope: "client",
        config: false,
        default: false,
        type:Boolean
    });
    game.settings.register("small-world", "canTranslateList",{
        name: "List of Contractors for Translation",
        scope: "world",
        config: false,
        default: [],
        type:Object
    });
    game.settings.register("small-world", "selectedLang",{
        name: "Selected language",
        scope: "client",
        config: false,
        default: "",
        type:String
    });
    game.settings.register("small-world", "translateTable",{
        name: "translatable languages list",
        scope: "client",
        config: false,
        default: {deepl:null, microsoft:null},
        type:Object
    });
    game.settings.register("small-world", "worldtranslateTable",{
        name: "translatable languages list (world)",
        scope: "world",
        config: false,
        default: {deepl:null, microsoft:null},
        type:Object
    });
    game.settings.register("small-world", "translateDeeplCount",{
        name: "Deepl translate char count",
        scope: "client",
        config: false,
        default: {count:0,limit:0},
        type:Object
    });
    game.settings.register("small-world", "translateMsCount",{
        name: "Microsoft translate char count",
        scope: "client",
        config: false,
        default: {count:0, limit:0},
        type:Object
    });
    game.settings.register("small-world", "deeplunseenkey", {
        name: "Deepl unseen Key",
        scope: "client",
        config: false,
        default: "",
        type: String
    });
    game.settings.register("small-world", "msunseenkey", {
        name: "Microsoft unseen Key",
        scope: "client",
        config: false,
        default: "",
        type: String
    });
    game.settings.register("small-world", "deeplkeyin", {
        name: "SMALLW.DeeplApiSecretKey",
        scope: "client",
        config: true,
        default: "",
        type: String,
        onChange: async (pass) => {
            if(pass != "*********************"){
                let code = await Code.encodechar(pass);
                let decode = await Code.decode(code);
                if(pass == decode) {
                    await game.settings.set("small-world", "deeplunseenkey", code);
                    await getTranslatablelist(true, false, true)
                }else{
                    console.error("decode error")
                }
                await game.settings.set("small-world", "deeplkeyin", "*********************");
                foundry.utils.debounce(window.location.reload(), 100)
            }
        }
    });
    game.settings.register("small-world", "deeplpro", {
        name: "SMALLW.DeeplPro",
        scope: "client",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("small-world", "deepllimit", {
        name: "SMALLW.DeeplLimit",
        hint: "SMALLW.DeeplLimitHint",
        scope: "client",
        config: true,
        default: 490000,
        type: Number,
        onChange: async (n) => {
            if(n == null){
                await getDeeplCount();
                let c = await game.settings.get("small-world", "translateDeeplCount");
                await game.settings.set("small-world", "deepllimit", c.limit - 10000)
            }
        }
    });
    game.settings.register("small-world", "mskeyin", {
        name: "SMALLW.MicrosoftApiSecretKey",
        scope: "client",
        config: true,
        default: "",
        type: String,
        onChange: async (pass) => {
            if(pass != "*********************"){
                let code = await Code.encodechar(pass);
                let decode = await Code.decode(code);
                if(pass == decode) {
                    await game.settings.set("small-world", "msunseenkey", code);
                    await getTranslatablelist(false, true, true)
                }else{
                    console.error("decode error")
                }
                await game.settings.set("small-world", "mskeyin", "*********************");
                foundry.utils.debounce(window.location.reload(), 100)
            }
        }
    });
    game.settings.register("small-world", "mslimit", {
        name: "SMALLW.MicrosoftLimit",
        hint: "SMALLW.MicrosoftLimitHint",
        scope: "client",
        config: true,
        default: 1990000,
        type: Number,
        onChange: async (n) =>{
            let c = await game.settings.get("small-world", "translateMsCount");
            c.limit = n;
            await game.settings.set("small-world", "translateMsCount", c);
        }
    });
    game.settings.register("small-world", "msCountReset", {
        name: "SMALLW.MsCountReset",
        hint: "SMALLW.MsCountResetHint",
        scope: "client",
        config: true,
        default: false,
        type: Boolean,
        onChange: async (n) => {
            if(n){
                let lim = await game.settings.get("small-world", "mslimit");
                await game.settings.set("small-world", "translateMsCount", {count: 0, limit:lim});
                await game.settings.set("small-world", "msCountReset", false);
            }
        }
    });
    await game.settings.register("small-world", "gmTranslate",{
        name: "SMALLW.GmTranslate",
        hint: "SMALLW.GmTranslateHint",
        scope:"world",
        config:true,
        default:false,
        onChange: () => foundry.utils.debounce(window.location.reload(), 100),
        type:Boolean
    });
    game.settings.register("small-world", "MsConnectionStatus", {
        name: "Connection status with server",
        scope:"client",
        config: false,
        default: false,
        type: Boolean
    });
    game.settings.register("small-world", "userLanguage", {
        name:"User's Language",
        scope:"client",
        config:false,
        default: "",
        type: String
    });
    game.settings.register("small-world", "dontDetectLang",{
        name: "SMALLW.DontDetectUserLang",
        hint: "SMALLW.DontDetectUserLangHint",
        scope:"client",
        config:true,
        default:false,
        type:Boolean
    });
    game.settings.register("small-world", "bilingual", {
        name: "SMALLW.Bilingual",
        hint: "SMALLW.BilingualHint",
        scope:"client",
        config:true,
        default:false,
        type:Boolean        
    });
    await getTranslatablelist(true, true);
    let langlist = await game.settings.get("small-world", "translateTable");
    let gmtrans = await game.settings.get("small-world", "gmTranslate");
    let worltable = await game.settings.get("small-world", "worldtranslateTable");
    let translatorlist = await game.settings.get("small-world", "canTranslateList");
    let translator = translatorlist.find(i => (i.deepl) && (i.microsoft) && (game.users.get(i.gmid).active));
    if((gmtrans && !!translator)) langlist = worltable;
    let choices = {};
    choices[`default`] = game.i18n.localize("SMALLW.PleaseChoice");
    if(langlist.deepl){
        for(let i = 0; i < langlist.deepl?.length; i++){
            choices[`${langlist.deepl[i]?.language}`] = langlist.deepl[i]?.name + "(deepl)";
        }
    }
    let msStatus = await game.settings.get("small-world", "MsConnectionStatus");
    if(msStatus || (gmtrans && !!translator)){
        for(let [key, value] of Object.entries(langlist.microsoft?.translation)){
            choices[`${key}`] = value.name + "(MS)"
        }
    }
    for(let j = 0; j < ORIGINAL_FONT_LIST.length; j++){
        choices[`${ORIGINAL_FONT_LIST[j].key}`] = ORIGINAL_FONT_LIST[j].name + "(code)"
    }

    await game.settings.register("small-world", "second-language",{
        name: "SMALLW.SecondLanguage",
        hint: "SMALLW.SecondLanguageHint" ,
        scope:"client",
        config:true,
        default:"default",
        type:String,
        choices:choices
    });
    game.settings.register("small-world", "dblFunction", {
        name: "SMALLW.DblClickFunction",
        hint: "SMALLW.DblClickFunctionHint",
        scope:"world",
        config:true,
        default:false,
        onChange: () => foundry.utils.debounce(window.location.reload(), 100),
        type:Boolean
    });

    let set = await game.settings.get("small-world", "second-language")
    if(!choices[set]) await game.settings.set("small-world", "second-language", "default")
  
    const users = game.users.contents;
    let bilingal = await game.settings.get("small-world", "bilingual")
    let send;
    let def = [];
    for(let k = 0; k < users.length; k++){
        def.push({id:users[k].id, name:users[k].name, type:1})
    }
    send = [...def]
    let flags;
    if(isNewVersion) {flags = game.user.flags} else {flags = game.user.data.flags}

    if(!flags["small-world"]){
        await game.user.setFlag('small-world', "select-users", send)
    }else{
        for(let i = 0; i < flags["small-world"]["select-users"].length; i++){
            let index = send.findIndex(j => (j.id == flags["small-world"]["select-users"][i].id) && (j.name == flags["small-world"]["select-users"][i].name));
            if(index >= 0){
                send[index] = {...flags["small-world"]["select-users"][i]}
            }
        }
        if(!bilingal) send.forEach(k => {if(k.type == 2) k.type = 1});
        await game.user.setFlag('small-world', "select-users", send);
    }

    game.user.setFlag("small-world", "translatable", true);

    /**
     *  i = 10 , k = 11 or (i = "pass", k = "pasta")
     *  {{#uniqueif i "===" k}}
     *  > false
     */
    Handlebars.registerHelper('uniqueif', function (v1, operator, v2, options) {
        switch (operator) {
            case '==':
                return (v1 == v2) ? options.fn(this) : options.inverse(this);
            case '===':
                return (v1 === v2) ? options.fn(this) : options.inverse(this);
            case '!=':
                return (v1 != v2) ? options.fn(this) : options.inverse(this);
            case '!==':
                return (v1 !== v2) ? options.fn(this) : options.inverse(this);
            case '<':
                return (v1 < v2) ? options.fn(this) : options.inverse(this);
            case '<=':
                return (v1 <= v2) ? options.fn(this) : options.inverse(this);
            case '>':
                return (v1 > v2) ? options.fn(this) : options.inverse(this);
            case '>=':
                return (v1 >= v2) ? options.fn(this) : options.inverse(this);
            case '&&':
                return (v1 && v2) ? options.fn(this) : options.inverse(this);
            case '||':
                return (v1 || v2) ? options.fn(this) : options.inverse(this);
            default:
                return options.inverse(this);
        }
    });
});

Hooks.on("renderChatMessage",  (message,html,data) => {
    let flags;
    if(isNewVersion) {flags = message.flags} else {flags = message.data.flags}

    html.on('dblclick', 'div.small-world', cl.bind(this))
    async function cl(event){
        if(event.shiftKey){
            event.preventDefault();
            let setting = await game.settings.get("small-world", "dblFunction");
            if(!setting || (game.user.isGM)){
                $(event.currentTarget).css('display', "none");
                if(!$(event.currentTarget).next(`div.small-world`)[0]){
                    $(event.currentTarget).parent().children(`div.small-world-display-default`).css('display', "inherit")
                }else{
                    $(event.currentTarget).next(`div.small-world`).css('display', "inherit")
                }
            }
        }
    }

    if(flags["small-world"]?.user){
        let index = flags["small-world"].user.findIndex(i => i.id == game.user.id)
        if(index >= 0){
            html.find(`div.message-content`).find(`div.small-world`).each(async function(idx, element) {
                if(flags["small-world"].user[index].type == 0){
                    if($(element).hasClass(`small-world-display-default`)) {
                        $(element).css('display', "inherit")
                    }
                }else if(flags["small-world"].user[index].type == 1){
                    if($(element).hasClass(`small-world-display-first`)) {
                        $(element).css('display', "inherit")
                    }
                }else if(flags["small-world"].user[index].type == 2){
                    if($(element).hasClass(`small-world-display-second`)) {
                        $(element).css('display', "inherit")
                    }
                }
            });
        }
    }
})

Hooks.once("ready", async function(){
    await getTranslatablelist(true, true, true);
    const userlang = await game.settings.get("core", "language");
    const langlist = await game.settings.get("small-world", "translateTable");
    let serch = langlist.deepl?.find((u) => u.language.toLowerCase() == userlang.toLowerCase());

    if(!serch) serch = langlist.microsoft?.translation[`${userlang.toLowerCase()}`]

    if(!!serch) {await game.settings.set("small-world", "userLanguage", userlang)}else{
        await game.settings.set("small-world", "userLanguage", "")
    }
    if(userlang == "zh-CN" || userlang == "cn" || userlang == "CN") await game.settings.set("small-world", "userLanguage", "zh");

    await getTranslatablelist(true, true);

    console.log(document.getElementById("chat-controls"))
    const chatControls = document.getElementById("chat-controls");
    let translateButtons = chatControls.getElementsByClassName("translate-buttons")[0];
    let transResource0 = document.createElement("a");
    let transResource1 = document.createElement("a");
    let transResource2 = document.createElement("a");
    let transResource3 = document.createElement("a");
    let transResource4 = document.createElement("a");
    transResource0.addEventListener("click", translateType.bind(this));
    transResource1.addEventListener("click", translateType.bind(this));
    transResource2.addEventListener("click", translateType.bind(this));
    transResource3.addEventListener("click", translateActivate.bind(this));
    transResource4.addEventListener("click", translateUserSelect.bind(this));
    transResource0.title = game.i18n.localize("SMALLW.Encryption");
    transResource1.title = game.i18n.localize("SMALLW.Deepl");
    transResource2.title = game.i18n.localize("SMALLW.MicrosoftTranslator");
    transResource3.title = game.i18n.localize("SMALLW.SwitchTrans");
    transResource4.title = game.i18n.localize("SMALLW.SettingForUsers");
    let icon0 = document.createElement("i");
    let icon1 = document.createElement("i");
    let icon2 = document.createElement("i");
    let icon3 = document.createElement("i");
    let icon4 = document.createElement("i");
    $(icon1).css({
        "font-size": "var(--font-size-18)",
    });
    $(icon2).css({
        "font-size": "var(--font-size-20)",
        "line-height": "28px"
    });
    $(icon3).css({
        "font-size": "var(--font-size-18)",
    });
    $(transResource0).css({
        display: "inline-block",
        width: "20px",
        "text-align": "center",
        margin: "0px 4px"
    });
    $(transResource1).css({
        display: "none",
        width: "20px",
        "text-align": "center",
        margin: "0px 4px"
    });
    $(transResource2).css({
        display: "none",
        width: "20px",
        "text-align": "center",
        margin: "0px 4px"
    });
    $(transResource3).css({
        display: "inline-block",
        width: "20px",
        "text-align": "center",
        margin: "0px 4px"
    });
    $(transResource4).css({
        display: "inline-block",
        width: "20px",
        "text-align": "center",
        margin: "0px 4px"
    });
    $(icon0).addClass("fas fa-dragon");
    $(icon1).addClass("fas fa-project-diagram");
    $(icon2).addClass("fab fa-microsoft");
    $(icon3).addClass("fas fa-language");
    $(icon4).addClass("fas fa-user-tag");
    $(transResource0).addClass("translate-local");
    $(transResource1).addClass("translate-deepl");
    $(transResource2).addClass("translate-microsoft");
    transResource0.appendChild(icon0);
    transResource1.appendChild(icon1);
    transResource2.appendChild(icon2);
    transResource3.appendChild(icon3);
    transResource4.appendChild(icon4);
    let transToSelect = document.createElement("select");
    $(transToSelect).addClass("translate-select");
    let sel = await game.settings.get("small-world", "selectedLang");
    let opt = await getOption(0, transToSelect, sel);

    transToSelect.style["width"] = "195px";
    transToSelect.style["background"] = "rgba(255, 255, 245, 0.8)";
    transToSelect.style["margin"] = "0px 4px";
    transToSelect.addEventListener('change', async function(){
        await game.settings.set("small-world", "selectedLang", this.value);
    })
    transToSelect.title = game.i18n.localize("SMALLW.TargetLanguage")

    if(translateButtons){

    }else{
        translateButtons = document.createElement("div");
        $(translateButtons).addClass("translate-buttons"); 
        translateButtons.style["flex-basis"] = "130px";
        translateButtons.appendChild(transResource0); 
        translateButtons.appendChild(transResource1); 
        translateButtons.appendChild(transResource2); 
        translateButtons.appendChild(transResource3);
        translateButtons.appendChild(transResource4);
        translateButtons.appendChild(transToSelect);
        chatControls.appendChild(translateButtons); 
    }

    let transType = await game.settings.get("small-world", "translateType");
    let tlist = await game.settings.get("small-world", "translateTable");
    let msStatus = await game.settings.get("small-world", "MsConnectionStatus");
    let gmtrans = await game.settings.get("small-world", "gmTranslate");
    let worltable = await game.settings.get("small-world", "worldtranslateTable");
    if((!msStatus && (!gmtrans || !worltable.microsoft)) && (transType == 2)) {
        transType = 0;
        await game.settings.set("small-world", "translateType", 0);
        await game.settings.set("small-world", "selectedLang", "");
    }
    if((tlist.deepl == null) && (transType == 1)) {
        transType = 0;
        await game.settings.set("small-world", "translateType", 0);
        await game.settings.set("small-world", "selectedLang", "");
    }

    if(transType == 1) {
        $(transResource0).css({
            "display": "none"
        })
        $(transResource1).css({
            "display": "inline-block"
        });
        transToSelect.options.length = 0;
        let sel = await game.settings.get("small-world", "selectedLang");
        await getOption(1, transToSelect, sel);
    }else if(transType == 2){
        $(transResource0).css({
            "display": "none"
        })
        $(transResource2).css({
            "display": "inline-block"
        });
        transToSelect.options.length = 0;
        let sel = await game.settings.get("small-world", "selectedLang");
        await getOption(2, transToSelect, sel);
    }
    let activate = await game.settings.get("small-world", "translateActivate");
    if(activate){
        $(transResource3).css({
            "border-left": "1px solid red",
            "border-right": "1px solid red",
            "box-shadow": "0 0 6px inset #ff6400",
            "background": "radial-gradient(closest-side at 50%, red 1%, transparent 99%)"
        })
    }

    game.socket.on('module.small-world', async (packet) => {
        const data = packet.data;
        const type = packet.type;
        const receiveUserId = packet.receiveUserId;
        const sendUserId = packet.sendUserId;
        if(receiveUserId == game.user.id){
            if(type == "request"){
                let status = await game.user.getFlag("small-world", "translatable");
                if(status){
                    let result = await createTranslation({...data, option:true});
                    if(result){
                        let sendData = {data:null, type:"complete", sendUserId:game.user.id, receiveUserId: sendUserId}
                        game.socket.emit('module.small-world', sendData)
                    }else{
                        let sendData = {data:data, type:"fail", sendUserId:game.user.id, receiveUserId: sendUserId}
                        game.socket.emit('module.small-world', sendData)
                    }
                }else{
                    let sendData = {data:data, type:"await", sendUserId:game.user.id, receiveUserId: sendUserId}
                    game.socket.emit('module.small-world', sendData)
                }
            }
            if(type == "complete"){
                console.log(game.i18n.format("SMALLW.Complete", {user:game.users.get(sendUserId).name}))
            }
            if(type == "fail"){
                let title =  game.i18n.localize("SMALLW.CantBeTrans");
                let content = `<p>${game.i18n.localize("SMALLW.ErrorTechnicalProblem")}<br>${game.i18n.localize("SMALLW.ErrorWithoutTranslation")}</p><br><br><textarea readonly>${data.copy.content}</textarea>`;
                await failpop(result = game.i18n.localize("SMALLW.ErrorTechnicalProblem"), chatData = data.copy, title, content);
            }
            if(type == "await"){
                let title = game.i18n.localize("SMALLW.AwaitSend");
                let content = `<p>${game.i18n.localize("SMALLW.AwaitSendContent")}<br>${game.i18n.localize("SMALLW.AwaitSelect")}</p><br><br>${game.i18n.localize("SMALLW.OriginalText")}:<br><textarea readonly>${data.copy.content}</textarea>`;
                let sendData = {data:data, type:"request", sendUserId:game.user.id, receiveUserId: sendUserId}
                awaitpop(packet = sendData, title, content);
            }
        }
    });
})

async function getTranslatablelist(deepl, ms, option){
    let dlresult = false;
    let msresult = false;
    let gmtrans =  await game.settings.get("small-world", "gmTranslate");
    let gmtable = await game.settings.get("small-world", "worldtranslateTable");

    if(deepl){
        let code = await game.settings.get("small-world", "deeplunseenkey");
        let decode = await Code.decode(code);
        let pro = await game.settings.get("small-world", "deeplpro");
        const API_KEY = decode;
        let url;

        if(pro){
            url = 'https://api.deepl.com/v2/languages';
        }else{
            url = 'https://api-free.deepl.com/v2/languages';
        }
        const DLAPI_URL = url;
        try{
            await $.ajax({
                type:"GET",
                url:DLAPI_URL,
                data:{
                    "auth_key": API_KEY,
                    "type": "target"
                },
                dataType: "json"
            })
            .done(async function(data){
                let list = await game.settings.get("small-world", "translateTable");
                list.deepl = data;
                dlresult = true;
                await game.settings.set("small-world", "translateTable", list);
            })
            .fail(async function(data){
                if(gmtrans && !!gmtable.deepl){
                    await game.settings.set("small-world", "translateTable", gmtable);
                }else{
                    console.error(data);
                    console.error(game.i18n.localize("SMALLW.ErrorDeeplApiKey"))
                    let list = await game.settings.get("small-world", "translateTable");
                    list.deepl = null;
                    await game.settings.set("small-world", "translateTable", list);
                }
            })
        }catch{}
    }

    if(ms){
        const MSAPI_URL = "https://api.cognitive.microsofttranslator.com/languages?api-version=3.0" + "&scope=translation";
        let userLanguage = await game.settings.get("small-world", "userLanguage");
        if(userLanguage == "zh") userLanguage = "zh-Hans";
        let detect = await game.settings.get("small-world", "dontDetectLang");
        if(!userLanguage || detect) userLanguage = "EN"

        try{
            await $.ajax({
                type: "GET",
                url: MSAPI_URL,
                headers:{
                    "Content-Type": "application/json; charset=UTF-8",
                    "Accept-Language": userLanguage
                },
                dataType: "json",
            })
            .done(async function(data){
                let list = await game.settings.get("small-world", "translateTable");
                list.microsoft = data;
                await game.settings.set("small-world", "translateTable", list);
            })
            .fail(async function(data){
                if(gmtrans && !!gmtable.microsoft){
                    await game.settings.set("small-world", "translateTable", gmtable);
                }else{
                    console.error(data);
                    let list = await game.settings.get("small-world", "translateTable");
                    list.microsoft = null;
                    await game.settings.set("small-world", "translateTable", list);
                }
            })
        }catch{}

        try{
            const TEST_URL = "https://api.cognitive.microsofttranslator.com/detect?api-version=3.0";
            let code = game.settings.get("small-world", "msunseenkey");
            let decode = await Code.decode(code);
            const API_KEY = decode;
            await $.ajax({
                type: "POST",
                url: TEST_URL,
                headers:{
                    "Ocp-Apim-Subscription-Key": API_KEY,
                    "Content-Type": "application/json"
                },
                dataType: "json",
                data: `[{"Text": ""}]`
            })
            .done(async function(data){
                msresult = true;
                await game.settings.set("small-world", "MsConnectionStatus", true);
            })
            .fail(async function(data){
                console.error(data);
                console.error(game.i18n.localize("SMALLW.ErrorMicrosoftApiKey"))
                let list = await game.settings.get("small-world", "translateTable");
                if(!gmtrans || !gmtable.microsoft)  {
                    list.microsoft = null;
                    await game.settings.set("small-world", "translateTable", list);
                }
                await game.settings.set("small-world", "MsConnectionStatus", false);
            })
        }catch{}
    }

    if(option){
        if(game.user.isGM){
            let list = await game.settings.get("small-world", "canTranslateList");
            let index = list.findIndex(i => i.gmid == game.user.id);
            if(index < 0){
                list.push({gmid: game.user.id, deepl: dlresult, microsoft: msresult})
            }else{
                if(list[index].deepl != dlresult) list[index].deepl = dlresult;
                if(list[index].microsoft != msresult) list[index].microsoft = msresult;
            }
            await game.settings.set("small-world", "canTranslateList", list);
            let worldlist = await game.settings.get("small-world", "worldtranslateTable");
            if(dlresult && msresult){
                worldlist =  await game.settings.get("small-world", "translateTable");
                game.settings.set("small-world", "worldtranslateTable", worldlist)
            }
            let dltranslator = list.find(i => i.deepl  && game.users.get(i.gmid).active);
            let mstranslator = list.find(i => i.microsoft  && game.users.get(i.gmid).active);
            if(!dltranslator) {
                worldlist.deepl = null;
                await game.settings.set("small-world", "worldtranslateTable", worldlist);
            }
            if(!mstranslator) {
                worldlist.microsoft = null;
                await game.settings.set("small-world", "worldtranslateTable", worldlist)
            }
        }
    }
}

async function translateType(event){
    event.preventDefault();
    let translatorlist = await game.settings.get("small-world", "canTranslateList");
    let translator = translatorlist.find(i => (i.deepl) && (i.microsoft) && (game.users.get(i.gmid).active));
    let transType = await game.settings.get("small-world", "translateType");
    let list = await game.settings.get("small-world", "translateTable");
    let msStatus = await game.settings.get("small-world", "MsConnectionStatus");
    let gmtrans = await game.settings.get("small-world", "gmTranslate");
    if((!msStatus && (!gmtrans || !translator)) && (transType == 1)) transType = 2;
    if((list.deepl == null) && (transType == 0))transType = 1;
    if((list.deepl == null) && (!msStatus && (!gmtrans || !translator)) && (transType != 2))transType = 2;
    $(event.currentTarget).css({
        "display": "none"
    });
    event.currentTarget.parentNode.getElementsByClassName("translate-select")[0].options.length = 0;
    if(transType == 2){
        getOption(0, event.currentTarget.parentNode.getElementsByClassName("translate-select")[0], "")
        $(event.currentTarget).parent("div.translate-buttons").children("a.translate-local").css({
            "display": "inline-block"
        })
    }else if(transType == 1){
        getOption(2, event.currentTarget.parentNode.getElementsByClassName("translate-select")[0], "")
        $(event.currentTarget).parent("div.translate-buttons").children("a.translate-microsoft").css({
            "display": "inline-block",
        });
    }else if(transType == 0){
        getOption(1, event.currentTarget.parentNode.getElementsByClassName("translate-select")[0], "")
        $(event.currentTarget).parent("div.translate-buttons").children("a.translate-deepl").css({
            "display": "inline-block",
        });
    }
    if(transType == 2) {transType = 0}else{transType += 1}
    await game.settings.set("small-world", "selectedLang", "");
    await game.settings.set("small-world", "translateType", transType);
}

async function translateActivate(event){
    event.preventDefault();
    let activate = await game.settings.get("small-world", "translateActivate");
    if(activate){
        $(event.currentTarget).css({
            "border-left": "",
            "border-right": "",
            "box-shadow": "",
            "background": ""
        })
    }else{
        $(event.currentTarget).css({
            "border-left": "1px solid red",
            "border-right": "1px solid red",
            "box-shadow": "0 0 6px inset #ff6400",
            "background": "radial-gradient(closest-side at 50%, red 1%, transparent 99%)"
        })
    }
    await game.settings.set("small-world", "translateActivate", !activate)
}

async function getOption(type, origin, select){
    var defoption = document.createElement("option");
    defoption.value = "";
    var deftext = document.createTextNode(game.i18n.localize("SMALLW.TargetLanguage"));
    defoption.appendChild(deftext);
    if(select == "") defoption.setAttribute("selected", "selected");
    defoption.setAttribute("hidden", "true");
    origin.appendChild(defoption);
    if(type == 0){
        let list = ORIGINAL_FONT_LIST;
        for(let i = 0; i < list.length; i++){
            var option = document.createElement("option");
            option.value = list[i].key;
            var text = document.createTextNode(list[i].name + "(code)");
            option.appendChild(text);
            if(select == list[i].key) option.setAttribute("selected", "selected");
            origin.appendChild(option);
        }
        return origin
    }else if(type == 1){
        let list = await game.settings.get("small-world", "translateTable");

        for(let i = 0; i < list.deepl.length; i++){
            var option = document.createElement("option");
            option.value = list.deepl[i].language;
            var text = document.createTextNode(list.deepl[i].name + "(deepl)");
            option.appendChild(text);
            if(select == list.deepl[i].language) option.setAttribute("selected", "selected");
            origin.appendChild(option);
        }
        return origin
    }else if(type == 2){
        let list = await game.settings.get("small-world", "translateTable");

        for(let [key, value] of Object.entries(list.microsoft?.translation)){
            var option = document.createElement("option");
            option.value = key;
            var text = document.createTextNode(value.name + "(MS)");
            option.appendChild(text);
            if(select == key) option.setAttribute("selected", "selected");
            origin.appendChild(option);
        }
        return origin
    }
}

async function translateUserSelect(event){
    event.preventDefault();
    const users = game.users.contents;
    let flags;
    if(isNewVersion) {flags = game.user.flags} else {flags = game.user.data.flags}
    let bilingal = await game.settings.get("small-world", "bilingual")
    let send;
    let def = [];
    for(let k = 0; k < users.length; k++){
        def.push({id:users[k].id, name:users[k].name, type:1})
    }
    send = [...def]
    if(!flags["small-world"]){
        await game.user.setFlag('small-world', "select-users", send)
    }else{
        for(let i = 0; i < flags["small-world"]["select-users"].length; i++){
            let index = send.findIndex(j => (j.id == flags["small-world"]["select-users"][i].id) && (j.name == flags["small-world"]["select-users"][i].name));
            if(index >= 0){
                send[index] = {...flags["small-world"]["select-users"][i]}
            }
        }
        if(!bilingal) send.forEach(k => {if(k.type == 2) k.type = 1});
        await game.user.setFlag('small-world', "select-users", send);
    }
    const html = await renderTemplate('modules/small-world/templates/UserSelectDialog.html', {users:flags["small-world"]["select-users"], bilingal:bilingal});
    const data =  await new Promise(resolve => {
        const dlg = new SmallWorldDialog({
            title: game.i18n.localize("SMALLW.UserTargetLangSelect"),
            content: html,
            buttons:{
                submit:{
                    label: game.i18n.localize("SMALLW.Save"),
                    icon: `<i class="far fa-save"></i>`,
                    callback: async (html) => {
                        formData = new FormData(html[0].querySelector('#select-user-lang'));
                        for(let l = 0; l < send.length; l++){
                            send[l].type = Number(formData.get(send[l].id));
                        }
                        await game.user.setFlag('small-world', "select-users", send);
                        return resolve(true)
                    }
                },
                reset:{
                    label: game.i18n.localize("SMALLW.Default"),
                    icon: `<i class="fas fa-undo"></i>`,
                    callback: async () => {
                        await game.user.setFlag('small-world', "select-users", def);
                        return resolve(true)
                    }
                }
            },
            default: '',
            close:() => { return resolve(false)}
        });
        dlg.render(true);
    });
}

class SmallWorldDialog extends Dialog{
    constructor(data, options) {
        super(options);
        this.data = data;
    }

    /**
   * @override
   * @returns {DialogOptions}
   */
	static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
        template: "templates/hud/dialog.html",
        classes: ["dialog"],
        width: 650,
        jQuery: true
      });
    }

}


class Code {
    static b64encode(...char){
        return new Promise(resolve => {
          const reader = new FileReader();
          reader.onload = () => {
            const offset = reader.result.indexOf(",") + 1;
            resolve(reader.result.slice(offset));
          };
          reader.readAsDataURL(new Blob(char));
        });
    }

    static async b64decode(char){
        const response = await fetch(`data:text/plain;base64,` + char);
        return await response.text();
    }

    static async encodechar(char){
        if(char != ""){
            let a = await Code.b64encode(char)
            var orig = a.split('');
            var newword = [];
            var result = [];
            let asciiLimit = 126;
            let asciiExclude = 32;
            let asciiOffset = asciiLimit - asciiExclude + 1;
            let getRangeValue = function(code, offs){
                return (code - asciiExclude + offs) % asciiOffset + asciiExclude
            };

            for (let i = 0; i < orig.length; i++){
                let offs = Math.round(Math.pow(i, 2) + (Math.pow(i, 3) / (i + 1)));
                let code = orig[i].charCodeAt(0);
                if(i % 2 == 0){
                    newword.push(getRangeValue(code, offs));
                }else{
                    newword.unshift(getRangeValue(code, offs));
                }
            }

            for (let j = 0; j < newword.length; j++){
                let keyNumber = String(newword[j]).charAt(String(newword[j]).length - 1);
                let prevCode = newword[j];
                result.push(String.fromCharCode(newword[j]));
                for (let k = 0; k < keyNumber; k++){
                    prevCode = getRangeValue(prevCode + Math.pow(prevCode, k), 0);
                    result.push(String.fromCharCode(prevCode));
                }
            }
            return result.join("");
        }else{
            return ""
        }
    }

    static async decode(char){
        if(char != ""){
            var word = String(char).split("")
            var w1 = [];
            var w2 = [];

            let asciiLimit = 126;
            let asciiExclude = 32;
            let asciiOffset = asciiLimit - asciiExclude + 1;

            let getOriginalCode = function(v, offs){
                if((offs - asciiExclude) % asciiOffset + asciiExclude >= asciiOffset){
                    if(v - (((offs - asciiExclude) % asciiOffset + asciiExclude) % asciiOffset) < asciiExclude){
                        return v - (((offs - asciiExclude) % asciiOffset + asciiExclude) % asciiOffset) + asciiOffset; 
                    }else{
                        return v - (((offs - asciiExclude) % asciiOffset + asciiExclude) % asciiOffset); 
                    }
                }else{
                    if(v - ((offs - asciiExclude) % asciiOffset + asciiExclude) < asciiExclude){
                        return v - ((offs - asciiExclude) % asciiOffset + asciiExclude) + asciiOffset;
                    }else{
                        return v - ((offs - asciiExclude) % asciiOffset + asciiExclude);
                    }
                }
            }

            for (let i = 0; i < word.length; i++){
                let code = word[i].charCodeAt(0);
                w1.push(code);
                i += parseInt(String(code).charAt(String(code).length - 1));
            }

            let length = w1.length;
            for(let j = 0; j < length; j++){
                if(j % 2){
                    var v = w1.pop();
                }else{
                    var v = w1.shift();
                }
                let foo = length - j - 1;
                let offs = Math.round(Math.pow(foo, 2) + (Math.pow(foo, 3) / (foo + 1)));

                w2.unshift(String.fromCharCode(getOriginalCode(v, offs)));
            }
            return Code.b64decode(w2.join(""));
        }else{
            return ""
        }
    }
}

class TransChat extends ChatLog {
    constructor(options) {
        super(options);
    }
}

Hooks.on("chatMessage", async (chatLog, message, chatData) =>{
    let parse = TransChat.parse(message);
    if(!chatData.flags) chatData.flags = {}
    let notskip = false
    switch (parse[0]) {
        case "roll": case "gmroll": case "blindroll": case "selfroll": case "publicroll": case "macro":
            notskip = true;
        break;
        case "whisper": case "reply": case "gm": case "players": case "ic": case "emote": case "ooc":
            notskip = false;
        break;
    }

    if(!notskip){
        Hooks.once("preCreateChatMessage",(document, data, options, userId) => {
            let flags;
            if(isNewVersion) {flags = document.flags} else {flags = document.data.flags}
            if(!flags.translate){
                return false
            }
        });

        let activate = await game.settings.get("small-world", "translateActivate");
        if(activate){
            let transType = await game.settings.get("small-world", "translateType");
            let transLang = await game.settings.get("small-world", "selectedLang");
            if(transLang == ""){
                ui.notifications.error(game.i18n.localize("SMALLW.ErrorTargetLangNone"));
                const dlg = new Dialog({
                    title: game.i18n.localize("SMALLW.ErrorTargetLangNone"),
                    content: `<p>${game.i18n.localize("SMALLW.ErrorWithoutTranslation")}</p><br><br><textarea readonly>${chatData.content}</textarea>`,
                    buttons:{
                        yes:{
                            label: game.i18n.localize("SMALLW.Yes"),
                            icon: `<i class="fas fa-check"></i>`,
                            callback: () => {
                                ChatMessage.create(chatData);
                            }
                        },
                        no:{
                            label: game.i18n.localize("SMALLW.No"),
                            icon: `<i class="fas fa-times"></i>`,
                            callback: () => {}
                        }
                    },
                    default: '',
                    close:() => {}
                });
                dlg.render(true);
            }else{
                let copy = {...chatData};
                let tag = htmlTokenizer(chatData.content);
                var targetlist = [];
                if(tag.length == 0) tag.push(chatData.content)
                var text = []
                for(let z = 0; z < tag.length; z++){
                    let t = tex = link = false;
                    if(tag[z].match(/^\<.*?\>/)) {t=tag[z];}else{tex=tag[z]}
                    targetlist.push({tag:t, text:tex});
                    if(tex) text.push(tex);
                }
                let senddata = "[";
                let count = 0;
                for(let i = 0; i < text.length; i++){
                    senddata += `{"Text": "${text[i]}"}`
                    count += text[i].length;
                    if(i != (text.length - 1)) senddata += ","
                }
                senddata += "]"

                let usersetting = await game.user.getFlag('small-world', "select-users");
                let bilingual = await game.settings.get("small-world", "bilingual");
                let secondL = await game.settings.get("small-world", "second-language");
                let userLanguage = await game.settings.get("small-world", "userLanguage");
                let detect = await game.settings.get("small-world", "dontDetectLang");
                let status = game.user.getFlag("small-world", "translatable");

                const data = {transType, transLang, chatData, copy, tag, targetlist, text, senddata, count, usersetting, bilingual, secondL, userLanguage, detect}

                let gmsetting = await game.settings.get("small-world", "gmTranslate");
                let gmlist = await game.settings.get("small-world", "canTranslateList");
                let check1, check2, check3 = false;
                let secondType;
                if(secondL != "default"){
                    if(secondL.match(/^small-world-font-/)){
                        secondType = "origin"
                    }else if(secondL.match(/^[a-z]/)){
                        secondType = "microsoft"
                    }else{
                        secondType = "deepl"
                    }
                }
                if(gmsetting){
                    let activelist = gmlist.filter(j => (game.users.get(j.gmid).active && j.deepl == true && j.microsoft == true));
                    for(let s = 0;s < activelist.length; s++){
                        if(transType == 0) check1 = true;
                        if(secondType == "origin") check2 = true;
                        if((transType == 0) && (secondType == "origin")) check3 = true;
                        if((transType == 1) && activelist[s].deepl) check1 = activelist[s].gmid;
                        if((transType == 2) && activelist[s].microsoft) check1 = activelist[s].gmid;
                        if((secondType == "deepl") && activelist[s].deepl) check2 = activelist[s].gmid;
                        if((secondType == "microsoft") && activelist[s].microsoft) check2 = activelist[s].gmid;
                    }

                    if(check3) {
                        await createTranslation({...data})
                    }else if(!!check1 && !!check2){
                        let msself = await game.settings.get("small-world", "MsConnectionStatus");
                        let dlself = await game.settings.get("small-world", "translateTable").deepl;
                        dlself = !!dlself;
                        if(check1 === true) {
                            if(game.user.id == check2){
                                if(status){
                                    createTranslation({...data});
                                }else{
                                    awaitself(data, copy);
                                }
                            }else{
                                if(dlself && msself){
                                    if(status){
                                        createTranslation({...data});
                                    }else{
                                        awaitself(data, copy);
                                    }
                                }else{
                                    let packet = {data:data, type:"request", receiveUserId: check2, sendUserId:game.user.id}
                                    game.socket.emit('module.small-world', packet);
                                }
                            }
                        }else if(check2 === true) {
                            if(game.user.id == check1){
                                if(status){
                                    createTranslation({...data});
                                }else{
                                    awaitself(data, copy);
                                }
                            }else{
                                if(dlself && msself){
                                    if(status){
                                        createTranslation({...data});
                                    }else{
                                        awaitself(data, copy);
                                    }
                                }else{
                                    let packet = {data:data, type:"request", receiveUserId: check1, sendUserId:game.user.id}
                                    game.socket.emit('module.small-world', packet);
                                }
                            }
                        }else{
                            if(game.user.id == check1){
                                if(status){
                                    createTranslation({...data});
                                }else{
                                    awaitself(data, copy);
                                }
                            }else{
                                if(dlself && msself){
                                    if(status){
                                        createTranslation({...data});
                                    }else{
                                        awaitself(data, copy);
                                    }
                                }else{
                                    let packet = {data:data, type:"request", receiveUserId: check2, sendUserId:game.user.id}
                                    game.socket.emit('module.small-world', packet);
                                }
                            }
                        }
                    }else{
                        if(status){
                            createTranslation({...data});
                        }else{
                            awaitself(data, copy);
                        }
                    }
                }else{
                    if(status){
                        createTranslation({...data});
                    }else{
                        awaitself(data, copy);
                    }
                }
            }
        }else{
            ChatMessage.create(chatData)
        }
    }
});

async function createTranslation({transType, transLang, chatData, copy, tag, targetlist, text, senddata, count, usersetting, bilingual, secondL, userLanguage, detect, option = false}){
    game.user.setFlag("small-world", "translatable", false);
    let bytes = text.join().bytes();
    if(transType == 0){
        let back = await new Promise( async resolve => {
            //First language = original
            let out = await getOriginalFontCode(text); 
            let reptrans = "";
            let i = 0;
            for(let j = 0; j < targetlist.length; j++){
                if(targetlist[j].tag) reptrans += targetlist[j].tag;
                if(targetlist[j].text) {
                    if(tag.length == 1) {
                        reptrans += `<span class="${transLang}">` + out[i] + `</span>`;
                    }else{
                        reptrans += `<span class="${transLang}" style="font-size:inherit">` + out[i] + `</span>`;
                    }
                    i +=1;}
            }
            chatData.flags["small-world"] = {active:null, user:usersetting}
            chatData.content = `<div class="small-world-display-default small-world" style="display:none">` + copy.content + `</div>`;
            chatData.content +=  `<div class="small-world-display-first small-world" style="display:none">` + reptrans + `</div>`;

            if(bilingual){
                if(detect) userLanguage = ""
                if(secondL != "default"){
                    if(secondL.match(/^small-world-font-/)){
                        //First language = original, second language = original
                        let out = await getOriginalFontCode(text); 
                        let reptrans = "";
                        let i = 0;
                        for(let j = 0; j < targetlist.length; j++){
                            if(targetlist[j].tag) reptrans += targetlist[j].tag;
                            if(targetlist[j].text) {
                                if(tag.length == 1) {
                                    reptrans += `<span class="${secondL}">` + out[i] + `</span>`;
                                }else{
                                    reptrans += `<span class="${secondL}" style="font-size:inherit">` + out[i] + `</span>`;
                                }
                                i +=1;}
                        }
                        chatData.content += `<div class="small-world-display-second small-world" style="display:none">` + reptrans + `</div>`;
                    }else if(secondL.match(/[a-z]/g)){
                        //First language = original, second language = ms
                        var charC = await game.settings.get("small-world", "translateMsCount");
                        let limit = game.settings.get("small-world", "mslimit");
                        if(charC.count > limit){
                            if(option){
                                return resolve(false)
                            }else{
                                const dlg = new Dialog({
                                    title: game.i18n.localize("SMALLW.CantBeTrans"),
                                    content: `<p>${game.i18n.localize("SMALLW.MsLimit")}<br>${game.i18n.localize("SMALLW.ErrorWithoutTranslation")}</p><br><br><textarea readonly>${copy.content}</textarea>`,
                                    buttons:{
                                        yes:{
                                            label:game.i18n.localize("SMALLW.Yes"),
                                            icon: `<i class="fas fa-check"></i>`,
                                            callback: () => {
                                                ChatMessage.create(copy);
                                            }
                                        },
                                        no:{
                                            label:game.i18n.localize("SMALLW.No"),
                                            icon: `<i class="fas fa-times"></i>`,
                                            callback: () => {}
                                        }
                                    },
                                    default: '',
                                    close:() => {}
                                });
                                dlg.render(true);
                            }
                        }else if((count > 10000) || (text.length > 999)){
                            if(option){
                                return resolve(false)
                            }else{
                                const dlg = new Dialog({
                                    title: game.i18n.localize("SMALLW.CantBeTrans"),
                                    content: `<p>${game.i18n.localize("SMALLW.MsSingleLimit")}<br>${game.i18n.localize("SMALLW.ErrorWithoutTranslation")}</p><br><br><textarea readonly>${copy.content}</textarea>`,
                                    buttons:{
                                        yes:{
                                            label:game.i18n.localize("SMALLW.Yes"),
                                            icon: `<i class="fas fa-check"></i>`,
                                            callback: () => {
                                                ChatMessage.create(copy);
                                            }
                                        },
                                        no:{
                                            label:game.i18n.localize("SMALLW.No"),
                                            icon: `<i class="fas fa-times"></i>`,
                                            callback: () => {}
                                        }
                                    },
                                    default: '',
                                    close:() => {}
                                });
                                dlg.render(true);
                            }
                        }else{
                            let code2 = game.settings.get("small-world", "msunseenkey");
                            let decode2 = await Code.decode(code2);
                            const API_KEY2 = decode2;
                            let lang2 = userLanguage;
                            if(lang2 == "zh") lang2 = "zh-Hans"
                            const API_URL2 = "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0" + `&from=${lang2}&to=${secondL}`;

                            await $.when(
                                getMstranslate(senddata, API_KEY2, API_URL2)
                            )
                            .done(async function (result){
                                let reptrans = "";
                                let i = 0;
                                for(let j = 0; j < targetlist.length; j++){
                                    if(targetlist[j].tag) reptrans += targetlist[j].tag;
                                    if(targetlist[j].text) {
                                        if(result[i].translations[0].to == "tlh-Piqd"){
                                            reptrans += `<span class="small-world-font-Piqd">` + result[i].translations[0].text + `</div>`;
                                        }else{
                                            reptrans += result[i].translations[0].text;
                                        }
                                        i +=1;
                                    }
                                }
                                console.log(`Translated:${copy.content} => ${reptrans}`)
                                chatData.content += `<div class="small-world-display-second small-world" style="display:none">` + reptrans + `</div>`;
                                game.settings.set("small-world", "translateMsCount", {count:charC.count + count,limit: limit});
                                console.log(`Your translated text at Microsoft Translator is ${charC.count + count}/${limit} characters.`)
                            })
                            .fail(async function(result){
                                    if(option){
                                        return resolve(false)
                                    }else{
                                        let title =  game.i18n.localize("SMALLW.CantBeTrans");
                                        let content = `<p>${game.i18n.localize("SMALLW.ErrorTechnicalProblem")}<br>${game.i18n.localize("SMALLW.ErrorWithoutTranslation")}</p><br><br><textarea readonly>${copy.content}</textarea>`;
                                        await failpop(result, chatData =  copy, title, content);
                                    }
                                }
                            )
                        }
                    }else{
                        //First language = original, second language = deepl
                        var charC = await game.settings.get("small-world", "translateDeeplCount");
                        let limit = await game.settings.get("small-world", "deepllimit");
                        if(charC.count > limit){
                            if(option){
                                return resolve(false)
                            }else{
                                const dlg = new Dialog({
                                    title: game.i18n.localize("SMALLW.CantBeTrans"),
                                    content: `<p>${game.i18n.localize("SMALLW.ErrorDeeplLimit")}<br>${game.i18n.localize("SMALLW.ErrorWithoutTranslation")}</p><br><br><textarea readonly>${copy.content}</textarea>`,
                                    buttons:{
                                        yes:{
                                            label:game.i18n.localize("SMALLW.Yes"),
                                            icon: `<i class="fas fa-check"></i>`,
                                            callback: () => {
                                                ChatMessage.create(copy);
                                            }
                                        },
                                        no:{
                                            label:game.i18n.localize("SMALLW.No"),
                                            icon: `<i class="fas fa-times"></i>`,
                                            callback: () => {}
                                        }
                                    },
                                    default: '',
                                    close:() => {}
                                });
                                dlg.render(true);
                            }
                        }else if(bytes > 128000 || text.length > 50){
                            if(option){
                                return resolve(false)
                            }else{
                                const dlg = new Dialog({
                                    title: game.i18n.localize("SMALLW.CantBeTrans"),
                                    content: `<p>${game.i18n.localize("SMALLW.ErrorDeeplSingleLimit")}<br>${game.i18n.localize("SMALLW.ErrorWithoutTranslation")}</p><br><br><textarea readonly>${copy.content}</textarea>`,
                                    buttons:{
                                        yes:{
                                            label:game.i18n.localize("SMALLW.Yes"),
                                            icon: `<i class="fas fa-check"></i>`,
                                            callback: () => {
                                                ChatMessage.create(copy);
                                            }
                                        },
                                        no:{
                                            label:game.i18n.localize("SMALLW.No"),
                                            icon: `<i class="fas fa-times"></i>`,
                                            callback: () => {}
                                        }
                                    },
                                    default: '',
                                    close:() => {}
                                });
                                dlg.render(true);
                            }
                        }else{
                            let code = await game.settings.get("small-world", "deeplunseenkey");
                            let decode = await Code.decode(code);
                            const API_KEY = decode;
                            let pro = await game.settings.get("small-world", "deeplpro");
                            if(detect) userLanguage = ""
                            let url;
                            if(pro){
                                url = 'https://api.deepl.com/v2/translate';
                            }else{
                                url = 'https://api-free.deepl.com/v2/translate';
                            }
                            const API_URL = url;
                            await $.when(
                                getDeepltranslate(text, API_KEY, API_URL, userLanguage, transLang = secondL)
                            )
                            .done(async function (result){
                                let reptrans = "";
                                let i = 0;
                                for(let j = 0; j < targetlist.length; j++){
                                    if(targetlist[j].tag) reptrans += targetlist[j].tag;
                                    if(targetlist[j].text) {reptrans += result.translations[i].text; i +=1;}
                                }
                                console.log(`Translated:${copy.content} => ${reptrans}`)
                                chatData.content += `<div class="small-world-display-second small-world" style="display:none">` + reptrans + `</div>`;
                                ChatMessage.create(copy);
                                await getDeeplCount();
                                let dlc = await game.settings.get("small-world", "translateDeeplCount");
                                console.log(`Your translated text at DeepL is ${dlc.count}/${limit} characters.`);
                            })
                            .fail(async function(result){
                                    if(option){
                                        return resolve(false)
                                    }else{
                                        let title =  game.i18n.localize("SMALLW.CantBeTrans");
                                        let content = `<p>${game.i18n.localize("SMALLW.ErrorTechnicalProblem")}<br>${game.i18n.localize("SMALLW.ErrorWithoutTranslation")}</p><br><br><textarea readonly>${copy.content}</textarea>`;
                                        await failpop(result, chatData =  copy, title, content);
                                    }
                                }
                            )
                        }
                    }
                }else{
                    if(option){
                        return resolve(false)
                    }else{
                        chatData = null;
                        const dlg = new Dialog({
                            title: game.i18n.localize("SMALLW.CantBeTrans"),
                            content: `<p>${game.i18n.localize("SMALLW.SecondLanguageDefault")}<br>${game.i18n.localize("SMALLW.ErrorWithoutTranslation")}</p><br><br><textarea readonly>${copy.content}</textarea>`,
                            buttons:{
                                yes:{
                                    label:game.i18n.localize("SMALLW.Yes"),
                                    icon: `<i class="fas fa-check"></i>`,
                                    callback: () => {
                                        ChatMessage.create(copy);
                                    }
                                },
                                no:{
                                    label:game.i18n.localize("SMALLW.No"),
                                    icon: `<i class="fas fa-times"></i>`,
                                    callback: () => {}
                                }
                            },
                            default: '',
                            close:() => {}
                        });
                        dlg.render(true);
                    }
                }
            }
            await ChatMessage.create(chatData);
            return resolve(true)
        })
        game.user.setFlag("small-world", "translatable", true);
        return back
    }else if(transType == 1){
        //First language = deepl
        var charC = await game.settings.get("small-world", "translateDeeplCount");
        let limit = await game.settings.get("small-world", "deepllimit");
        if(charC.count > limit){
            game.user.setFlag("small-world", "translatable", true);
            if(option){
                return false
            }else{
                const dlg = new Dialog({
                    title: game.i18n.localize("SMALLW.CantBeTrans"),
                    content: `<p>${game.i18n.localize("SMALLW.ErrorDeeplLimit")}<br>${game.i18n.localize("SMALLW.ErrorWithoutTranslation")}</p><br><br><textarea readonly>${copy.content}</textarea>`,
                    buttons:{
                        yes:{
                            label:game.i18n.localize("SMALLW.Yes"),
                            icon: `<i class="fas fa-check"></i>`,
                            callback: () => {
                                ChatMessage.create(copy);
                            }
                        },
                        no:{
                            label:game.i18n.localize("SMALLW.No"),
                            icon: `<i class="fas fa-times"></i>`,
                            callback: () => {}
                        }
                    },
                    default: '',
                    close:() => {}
                });
                dlg.render(true);
            }
        }else if(bytes > 128000 || text.length > 50){
            game.user.setFlag("small-world", "translatable", true);
            if(option){
                return false
            }else{
                const dlg = new Dialog({
                    title: game.i18n.localize("SMALLW.CantBeTrans"),
                    content: `<p>${game.i18n.localize("SMALLW.ErrorDeeplSingleLimit")}<br>${game.i18n.localize("SMALLW.ErrorWithoutTranslation")}</p><br><br><textarea readonly>${copy.content}</textarea>`,
                    buttons:{
                        yes:{
                            label:game.i18n.localize("SMALLW.Yes"),
                            icon: `<i class="fas fa-check"></i>`,
                            callback: () => {
                                ChatMessage.create(copy);
                            }
                        },
                        no:{
                            label:game.i18n.localize("SMALLW.No"),
                            icon: `<i class="fas fa-times"></i>`,
                            callback: () => {}
                        }
                    },
                    default: '',
                    close:() => {}
                });
                dlg.render(true);
            }
        }else{
            let back = await new Promise( resolve =>{ (async() => {
                let code = await game.settings.get("small-world", "deeplunseenkey");
                let decode = await Code.decode(code);
                const API_KEY = decode;
                let pro = await game.settings.get("small-world", "deeplpro");
                if(detect) userLanguage = ""
                let url;
                if(pro){
                    url = 'https://api.deepl.com/v2/translate';
                }else{
                    url = 'https://api-free.deepl.com/v2/translate';
                }
                const API_URL = url;

                $.when(
                    getDeepltranslate(text, API_KEY, API_URL, userLanguage, transLang)
                )
                .done(async function (result){
                    let reptrans = "";
                    let i = 0;
                    for(let j = 0; j < targetlist.length; j++){
                        if(targetlist[j].tag) reptrans += targetlist[j].tag;
                        if(targetlist[j].text) {reptrans += result.translations[i].text; i +=1;}
                    }
                    console.log(`Translated:${chatData.content} => ${reptrans}`)
                    chatData.flags["small-world"] = {origin:chatData.content,trans:{transLang:transLang, text: reptrans}, active:null, user:usersetting}
                    chatData.content = `<div class="small-world-display-default small-world" style="display:none">` + copy.content + `</div>`;
                    chatData.content +=  `<div class="small-world-display-first small-world" style="display:none">` + reptrans + `</div>`;
                    await getDeeplCount();
                    let dlc = await game.settings.get("small-world", "translateDeeplCount");
                    console.log(`Your translated text at DeepL is ${dlc.count}/${limit} characters.`);

                    if(bilingual){
                        if(secondL != "default"){
                            if(secondL.match(/^small-world-font-/)){
                                //First language = deepl, second language = original
                                let out = await getOriginalFontCode(text); 
                                let reptrans = "";
                                let i = 0;
                                for(let j = 0; j < targetlist.length; j++){
                                    if(targetlist[j].tag) reptrans += targetlist[j].tag;
                                    if(targetlist[j].text) {
                                        if(tag.length == 1) {
                                            reptrans += `<span class="${secondL}">` + out[i] + `</span>`;
                                        }else{
                                            reptrans += `<span class="${secondL}" style="font-size:inherit">` + out[i] + `</span>`;
                                        }
                                        i +=1;}
                                }
                                chatData.content +=  `<div class="small-world-display-second small-world" style="display:none">` + reptrans + `</div>`;
                            }else if(secondL.match(/[a-z]/g)){
                                //Fist language = deepl, second language = ms
                                var charC2 = await game.settings.get("small-world", "translateMsCount");
                                let limit2 = await game.settings.get("small-world", "mslimit");
                                if(charC2.count > limit2){
                                    if(option){
                                        return resolve(false)
                                    }else{
                                        const dlg = new Dialog({
                                            title: game.i18n.localize("SMALLW.CantBeTrans"),
                                            content: `<p>${game.i18n.localize("SMALLW.MsLimit")}<br>${game.i18n.localize("SMALLW.ErrorWithoutTranslation")}</p><br><br><textarea readonly>${copy.content}</textarea>`,
                                            buttons:{
                                                yes:{
                                                    label:game.i18n.localize("SMALLW.Yes"),
                                                    icon: `<i class="fas fa-check"></i>`,
                                                    callback: () => {
                                                        ChatMessage.create(copy);
                                                    }
                                                },
                                                no:{
                                                    label:game.i18n.localize("SMALLW.No"),
                                                    icon: `<i class="fas fa-times"></i>`,
                                                    callback: () => {}
                                                }
                                            },
                                            default: '',
                                            close:() => {}
                                        });
                                        dlg.render(true);
                                    }
                                }else if((count > 10000) || (text.length > 999)){
                                    if(option){
                                        return resolve(false)
                                    }else{
                                        const dlg = new Dialog({
                                            title: game.i18n.localize("SMALLW.CantBeTrans"),
                                            content: `<p>${game.i18n.localize("SMALLW.MsSingleLimit")}<br>${game.i18n.localize("SMALLW.ErrorWithoutTranslation")}</p><br><br><textarea readonly>${copy.content}</textarea>`,
                                            buttons:{
                                                yes:{
                                                    label:game.i18n.localize("SMALLW.Yes"),
                                                    icon: `<i class="fas fa-check"></i>`,
                                                    callback: () => {
                                                        ChatMessage.create(copy);
                                                    }
                                                },
                                                no:{
                                                    label:game.i18n.localize("SMALLW.No"),
                                                    icon: `<i class="fas fa-times"></i>`,
                                                    callback: () => {}
                                                }
                                            },
                                            default: '',
                                            close:() => {}
                                        });
                                        dlg.render(true);
                                    }
                                }else{
                                    let code2 = await game.settings.get("small-world", "msunseenkey");
                                    let decode2 = await Code.decode(code2);
                                    const API_KEY2 = decode2;
                                    let lang2 = userLanguage;
                                    if(lang2 == "zh") lang2 = "zh-Hans";
                                    const API_URL2 = "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0" + `&from=${lang2}&to=${secondL}`;
                                    await $.when(
                                        getMstranslate(senddata, API_KEY2, API_URL2)
                                    )
                                    .done(async function (result){
                                        let reptrans = "";
                                        let i = 0;
                                        for(let j = 0; j < targetlist.length; j++){
                                            if(targetlist[j].tag) reptrans += targetlist[j].tag;
                                            if(targetlist[j].text) {
                                                if(result[i].translations[0].to == "tlh-Piqd"){
                                                    reptrans += `<span class="small-world-font-Piqd">` + result[i].translations[0].text + `</div>`;
                                                }else{
                                                    reptrans += result[i].translations[0].text;
                                                }
                                                i +=1;
                                            }
                                        }
                                        console.log(`Translated:${copy.content} => ${reptrans}`)
                                        chatData.content +=  `<div class="small-world-display-second small-world" style="display:none">` + reptrans + `</div>`;
                                        game.settings.set("small-world", "translateMsCount", {count:charC2.count + count,limit: limit2});
                                        console.log(`Your translated text at Microsoft Translator is ${charC2.count + count}/${limit2} characters.`)
                                    })
                                    .fail(async function(result){
                                            if(option){
                                                return resolve(false)
                                            }else{
                                                let title =  game.i18n.localize("SMALLW.CantBeTrans");
                                                let content = `<p>${game.i18n.localize("SMALLW.ErrorTechnicalProblem")}<br>${game.i18n.localize("SMALLW.ErrorWithoutTranslation")}</p><br><br><textarea readonly>${copy.content}</textarea>`;
                                                await failpop(result, chatData =  copy, title, content);
                                            }
                                        }
                                    )
                                }
                            }else{
                                //First language = deepl, second language = deepl
                                if(charC.count + count + count > limit){
                                    if(option){
                                        return resolve(false)
                                    }else{
                                        const dlg = new Dialog({
                                            title: game.i18n.localize("SMALLW.CantBeTrans"),
                                            content: `<p>${game.i18n.localize("SMALLW.ErrorDeeplLimit")}<br>${game.i18n.localize("SMALLW.ErrorWithoutTranslation")}</p><br><br><textarea readonly>${copy.content}</textarea>`,
                                            buttons:{
                                                yes:{
                                                    label:game.i18n.localize("SMALLW.Yes"),
                                                    icon: `<i class="fas fa-check"></i>`,
                                                    callback: () => {
                                                        ChatMessage.create(copy);
                                                    }
                                                },
                                                no:{
                                                    label:game.i18n.localize("SMALLW.No"),
                                                    icon: `<i class="fas fa-times"></i>`,
                                                    callback: () => {}
                                                }
                                            },
                                            default: '',
                                            close:() => {}
                                        });
                                        dlg.render(true);
                                    }
                                }else if(bytes > 128000 || text.length > 50){
                                    if(option){
                                        return resolve(false)
                                    }else{
                                        const dlg = new Dialog({
                                            title: game.i18n.localize("SMALLW.CantBeTrans"),
                                            content: `<p>${game.i18n.localize("SMALLW.ErrorDeeplSingleLimit")}<br>${game.i18n.localize("SMALLW.ErrorWithoutTranslation")}</p><br><br><textarea readonly>${copy.content}</textarea>`,
                                            buttons:{
                                                yes:{
                                                    label:game.i18n.localize("SMALLW.Yes"),
                                                    icon: `<i class="fas fa-check"></i>`,
                                                    callback: () => {
                                                        ChatMessage.create(copy);
                                                    }
                                                },
                                                no:{
                                                    label:game.i18n.localize("SMALLW.No"),
                                                    icon: `<i class="fas fa-times"></i>`,
                                                    callback: () => {}
                                                }
                                            },
                                            default: '',
                                            close:() => {}
                                        });
                                        dlg.render(true);
                                    }
                                }else{
                                    let code = await game.settings.get("small-world", "deeplunseenkey");
                                    let decode = await Code.decode(code);
                                    const API_KEY = decode;
                                    let pro = await game.settings.get("small-world", "deeplpro");
                                    let url;
                                    if(pro){
                                        url = 'https://api.deepl.com/v2/translate';
                                    }else{
                                        url = 'https://api-free.deepl.com/v2/translate';
                                    }
                                    const API_URL = url;
                                    await $.when(
                                        getDeepltranslate(text, API_KEY, API_URL, userLanguage, transLang = secondL)
                                    )
                                    .done(async function (result){
                                        let reptrans = "";
                                        let i = 0;
                                        for(let j = 0; j < targetlist.length; j++){
                                            if(targetlist[j].tag) reptrans += targetlist[j].tag;
                                            if(targetlist[j].text) {reptrans += result.translations[i].text; i +=1;}
                                        }
                                        console.log(`Translated:${copy.content} => ${reptrans}`)
                                        chatData.content +=  `<div class="small-world-display-second small-world" style="display:none">` + reptrans + `</div>`;
                                        await getDeeplCount();
                                        let dlc = await game.settings.get("small-world", "translateDeeplCount");
                                        console.log(`Your translated text at DeepL is ${dlc.count}/${limit} characters.`);
                                    })
                                    .fail(async function(result){
                                            if(option){
                                                return resolve(false)
                                            }else{
                                                let title =  game.i18n.localize("SMALLW.CantBeTrans");
                                                let content = `<p>${game.i18n.localize("SMALLW.ErrorTechnicalProblem")}<br>${game.i18n.localize("SMALLW.ErrorWithoutTranslation")}</p><br><br><textarea readonly>${copy.content}</textarea>`;
                                                await failpop(result, chatData = copy, title, content);
                                            }
                                        }
                                    )
                                }
                            }
                        }else{
                            if(option){
                                return resolve(false)
                            }else{
                                chatData = null
                                const dlg = new Dialog({
                                    title: game.i18n.localize("SMALLW.CantBeTrans"),
                                    content: `<p>${game.i18n.localize("SMALLW.SecondLanguageDefault")}<br>${game.i18n.localize("SMALLW.ErrorWithoutTranslation")}</p><br><br><textarea readonly>${copy.content}</textarea>`,
                                    buttons:{
                                        yes:{
                                            label:game.i18n.localize("SMALLW.Yes"),
                                            icon: `<i class="fas fa-check"></i>`,
                                            callback: () => {
                                                ChatMessage.create(copy);
                                            }
                                        },
                                        no:{
                                            label:game.i18n.localize("SMALLW.No"),
                                            icon: `<i class="fas fa-times"></i>`,
                                            callback: () => {}
                                        }
                                    },
                                    default: '',
                                    close:() => {}
                                });
                                dlg.render(true);
                            }
                        }
                    }
                    await ChatMessage.create(chatData);
                    return resolve(true)
                })
                .fail(async function(result){
                        if(option){
                            return resolve(false)
                        }else{
                            let title =  game.i18n.localize("SMALLW.CantBeTrans");
                            let content = `<p>${game.i18n.localize("SMALLW.ErrorTechnicalProblem")}<br>${game.i18n.localize("SMALLW.ErrorWithoutTranslation")}</p><br><br><textarea readonly>${copy.content}</textarea>`;
                            await failpop(result, chatData = copy, title, content);
                        }
                    }
                )
            })();})
            game.user.setFlag("small-world", "translatable", true);
            return back
        }
    }else if(transType == 2){
        //First language = ms
        var charC = await game.settings.get("small-world", "translateMsCount");
        let limit = await game.settings.get("small-world", "mslimit");
        if(charC.count > limit){
            game.user.setFlag("small-world", "translatable", true);
            if(option){
                return false
            }else{
                const dlg = new Dialog({
                    title: game.i18n.localize("SMALLW.CantBeTrans"),
                    content: `<p>${game.i18n.localize("SMALLW.MsLimit")}<br>${game.i18n.localize("SMALLW.ErrorWithoutTranslation")}</p><br><br><textarea readonly>${copy.content}</textarea>`,
                    buttons:{
                        yes:{
                            label:game.i18n.localize("SMALLW.Yes"),
                            icon: `<i class="fas fa-check"></i>`,
                            callback: () => {
                                ChatMessage.create(copy);
                            }
                        },
                        no:{
                            label:game.i18n.localize("SMALLW.No"),
                            icon: `<i class="fas fa-times"></i>`,
                            callback: () => {}
                        }
                    },
                    default: '',
                    close:() => {}
                });
                dlg.render(true);
            }
        }else if((count > 10000) || (text.length > 999)){
            game.user.setFlag("small-world", "translatable", true);
            if(option){
                return false
            }else{
                const dlg = new Dialog({
                    title: game.i18n.localize("SMALLW.CantBeTrans"),
                    content: `<p>${game.i18n.localize("SMALLW.ErrorDeeplSingleLimit")}<br>${game.i18n.localize("SMALLW.ErrorWithoutTranslation")}</p><br><br><textarea readonly>${copy.content}</textarea>`,
                    buttons:{
                        yes:{
                            label:game.i18n.localize("SMALLW.Yes"),
                            icon: `<i class="fas fa-check"></i>`,
                            callback: () => {
                                ChatMessage.create(copy);
                            }
                        },
                        no:{
                            label:game.i18n.localize("SMALLW.No"),
                            icon: `<i class="fas fa-times"></i>`,
                            callback: () => {}
                        }
                    },
                    default: '',
                    close:() => {}
                });
                dlg.render(true);
            }
        }else{
            let back = await new Promise( resolve => {(async () => {
                let code = await game.settings.get("small-world", "msunseenkey");
                if(detect) userLanguage = ""
                let decode = await Code.decode(code);
                const API_KEY = decode;
                let lang = userLanguage;
                if(lang == "zh") lang = "zh-Hans";
                const API_URL = "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0" + `&from=${lang}&to=${transLang}`;

                //let result;
                $.when(
                    getMstranslate(senddata, API_KEY, API_URL)
                )
                .done(async function (result){
                    let reptrans = "";
                    let i = 0;
                    for(let j = 0; j < targetlist.length; j++){
                        if(targetlist[j].tag) reptrans += targetlist[j].tag;
                        if(targetlist[j].text) {
                            if(result[i].translations[0].to == "tlh-Piqd"){
                                reptrans += `<span class="small-world-font-Piqd">` + result[i].translations[0].text + `</div>`;
                            }else{
                                reptrans += result[i].translations[0].text;
                            }
                            i +=1;
                        }
                    }
                    console.log(`Translated:${chatData.content} => ${reptrans}`)
                    chatData.flags["small-world"] = {origin:chatData.content,trans:{transLang:transLang, text: reptrans}, active:null, user:usersetting}
                    chatData.content = `<div class="small-world-display-default small-world" style="display:none">` + copy.content + `</div>`;
                    chatData.content +=  `<div class="small-world-display-first small-world" style="display:none">` + reptrans + `</div>`;
                    game.settings.set("small-world", "translateMsCount", {count:charC.count + count,limit: limit});
                    console.log(`Your translated text at Microsoft Translator is ${charC.count + count}/${limit} characters.`)

                    //if bilingal setting = true
                    if(bilingual){
                        if(secondL != "default"){
                            if(secondL.match(/^small-world-font-/)){
                                //First language = ms, second language = original
                                let out = await getOriginalFontCode(text); 
                                let reptrans = "";
                                let i = 0;
                                for(let j = 0; j < targetlist.length; j++){
                                    if(targetlist[j].tag) reptrans += targetlist[j].tag;
                                    if(targetlist[j].text) {
                                        if(tag.length == 1) {
                                            reptrans += `<span class="${secondL}">` + out[i] + `</span>`;
                                        }else{
                                            reptrans += `<span class="${secondL}" style="font-size:inherit">` + out[i] + `</span>`;
                                        }
                                        i +=1;}
                                }
                                chatData.content +=  `<div class="small-world-display-second small-world" style="display:none">` + reptrans + `</div>`;
                            }else if(secondL.match(/[a-z]/g)){
                                //First language = ms, second language = ms
                                if(charC.count + count > limit){
                                    if(option){
                                        return resolve(false)
                                    }else{
                                        const dlg = new Dialog({
                                            title: game.i18n.localize("SMALLW.CantBeTrans"),
                                            content: `<p>${game.i18n.localize("SMALLW.MsLimit")}<br>${game.i18n.localize("SMALLW.ErrorWithoutTranslation")}</p><br><br><textarea readonly>${copy.content}</textarea>`,
                                            buttons:{
                                                yes:{
                                                    label:game.i18n.localize("SMALLW.Yes"),
                                                    icon: `<i class="fas fa-check"></i>`,
                                                    callback: () => {
                                                        ChatMessage.create(copy);
                                                    }
                                                },
                                                no:{
                                                    label:game.i18n.localize("SMALLW.No"),
                                                    icon: `<i class="fas fa-times"></i>`,
                                                    callback: () => {}
                                                }
                                            },
                                            default: '',
                                            close:() => {}
                                        });
                                        dlg.render(true);
                                    }
                                }else if((count > 10000) || (text.length > 999)){
                                    if(option){
                                        return resolve(false)
                                    }else{
                                        const dlg = new Dialog({
                                            title: game.i18n.localize("SMALLW.CantBeTrans"),
                                            content: `<p>${game.i18n.localize("SMALLW.MsSingleLimit")}<br>${game.i18n.localize("SMALLW.ErrorWithoutTranslation")}</p><br><br><textarea readonly>${copy.content}</textarea>`,
                                            buttons:{
                                                yes:{
                                                    label:game.i18n.localize("SMALLW.Yes"),
                                                    icon: `<i class="fas fa-check"></i>`,
                                                    callback: () => {
                                                        ChatMessage.create(copy);
                                                    }
                                                },
                                                no:{
                                                    label:game.i18n.localize("SMALLW.No"),
                                                    icon: `<i class="fas fa-times"></i>`,
                                                    callback: () => {}
                                                }
                                            },
                                            default: '',
                                            close:() => {}
                                        });
                                        dlg.render(true);
                                    }
                                }else{
                                    const API_URL2 = "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0" + `&from=${lang}&to=${secondL}`;
                                    await $.when(
                                        getMstranslate(senddata, API_KEY, API_URL2)
                                    )
                                    .done(async function (result){
                                        let reptrans = "";
                                        let i = 0;
                                        for(let j = 0; j < targetlist.length; j++){
                                            if(targetlist[j].tag) reptrans += targetlist[j].tag;
                                            if(targetlist[j].text) {
                                                if(result[i].translations[0].to == "tlh-Piqd"){
                                                    reptrans += `<span class="small-world-font-Piqd">` + result[i].translations[0].text + `</div>`;
                                                }else{
                                                    reptrans += result[i].translations[0].text;
                                                }
                                                i +=1;
                                            }
                                        }
                                        console.log(`Translated:${copy.content} => ${reptrans}`)
                                        chatData.content +=  `<div class="small-world-display-second small-world" style="display:none">` + reptrans + `</div>`;
                                        game.settings.set("small-world", "translateMsCount", {count:charC.count + count + count,limit: limit});
                                        console.log(`Your translated text at Microsoft Translator is ${charC.count + count + count}/${limit} characters.`)
                                    })
                                    .fail(async function(result){
                                            if(option){
                                                return resolve(false)
                                            }else{
                                                let title =  game.i18n.localize("SMALLW.CantBeTrans");
                                                let content = `<p>${game.i18n.localize("SMALLW.ErrorTechnicalProblem")}<br>${game.i18n.localize("SMALLW.ErrorWithoutTranslation")}</p><br><br><textarea readonly>${copy.content}</textarea>`;
                                                await failpop(result, chatData = copy, title, content);
                                            }
                                        }
                                    )
                                }
                            }else{
                                //First language = ms, second language = deepl
                                var charC2 = await game.settings.get("small-world", "translateDeeplCount");
                                let limit2 = await game.settings.get("small-world", "deepllimit");
                                if(charC2.count > limit2){
                                    if(option){
                                        return resolve(false)
                                    }else{
                                        const dlg = new Dialog({
                                            title: game.i18n.localize("SMALLW.CantBeTrans"),
                                            content: `<p>${game.i18n.localize("SMALLW.ErrorDeeplLimit")}<br>${game.i18n.localize("SMALLW.ErrorWithoutTranslation")}</p><br><br><textarea readonly>${copy.content}</textarea>`,
                                            buttons:{
                                                yes:{
                                                    label:game.i18n.localize("SMALLW.Yes"),
                                                    icon: `<i class="fas fa-check"></i>`,
                                                    callback: () => {
                                                        ChatMessage.create(copy);
                                                    }
                                                },
                                                no:{
                                                    label:game.i18n.localize("SMALLW.No"),
                                                    icon: `<i class="fas fa-times"></i>`,
                                                    callback: () => {}
                                                }
                                            },
                                            default: '',
                                            close:() => {}
                                        });
                                        dlg.render(true);
                                    }
                                }else if(bytes > 128000 || text.length > 50){
                                    if(option){
                                        return resolve(false)
                                    }else{
                                        const dlg = new Dialog({
                                            title: game.i18n.localize("SMALLW.CantBeTrans"),
                                            content: `<p>${game.i18n.localize("SMALLW.ErrorDeeplSingleLimit")}<br>${game.i18n.localize("SMALLW.ErrorWithoutTranslation")}</p><br><br><textarea readonly>${copy.content}</textarea>`,
                                            buttons:{
                                                yes:{
                                                    label:game.i18n.localize("SMALLW.Yes"),
                                                    icon: `<i class="fas fa-check"></i>`,
                                                    callback: () => {
                                                        ChatMessage.create(copy);
                                                    }
                                                },
                                                no:{
                                                    label:game.i18n.localize("SMALLW.No"),
                                                    icon: `<i class="fas fa-times"></i>`,
                                                    callback: () => {}
                                                }
                                            },
                                            default: '',
                                            close:() => {}
                                        });
                                        dlg.render(true);
                                    }
                                }else{
                                    let code2 = await game.settings.get("small-world", "deeplunseenkey");
                                    let decode2 = await Code.decode(code2);
                                    const API_KEY2 = decode2;
                                    let pro = await game.settings.get("small-world", "deeplpro");
                                    let url2;
                                    if(pro){
                                        url2 = 'https://api.deepl.com/v2/translate';
                                    }else{
                                        url2 = 'https://api-free.deepl.com/v2/translate';
                                    }
                                    const API_URL2 = url2;
                                    await $.when(
                                        getDeepltranslate(text, API_KEY2, API_URL2, userLanguage, transLang = secondL)
                                    )
                                    .done(async function (result){
                                        let reptrans = "";
                                        let i = 0;
                                        for(let j = 0; j < targetlist.length; j++){
                                            if(targetlist[j].tag) reptrans += targetlist[j].tag;
                                            if(targetlist[j].text) {reptrans += result.translations[i].text; i +=1;}
                                        }
                                        console.log(`Translated:${copy.content} => ${reptrans}`)
                                        chatData.content +=  `<div class="small-world-display-second small-world" style="display:none">` + reptrans + `</div>`;
                                        await getDeeplCount();
                                        let dlc = await game.settings.get("small-world", "translateDeeplCount");
                                        console.log(`Your translated text at DeepL is ${dlc.count}/${limit2} characters.`);
                                    })
                                    .fail(async function(result){
                                            if(option){
                                                return resolve(false)
                                            }else{
                                                let title =  game.i18n.localize("SMALLW.CantBeTrans");
                                                let content = `<p>${game.i18n.localize("SMALLW.ErrorTechnicalProblem")}<br>${game.i18n.localize("SMALLW.ErrorWithoutTranslation")}</p><br><br><textarea readonly>${copy.content}</textarea>`;
                                                await failpop(result, copy, title, content);
                                            }
                                        }
                                    )
                                }
                            }
                        }else{
                            if(option){
                                return resolve(false)
                            }else{
                                chatData = null
                                const dlg = new Dialog({
                                    title: game.i18n.localize("SMALLW.CantBeTrans"),
                                    content: `<p>${game.i18n.localize("SMALLW.SecondLanguageDefault")}<br>${game.i18n.localize("SMALLW.ErrorWithoutTranslation")}</p><br><br><textarea readonly>${copy.content}</textarea>`,
                                    buttons:{
                                        yes:{
                                            label:game.i18n.localize("SMALLW.Yes"),
                                            icon: `<i class="fas fa-check"></i>`,
                                            callback: () => {
                                                ChatMessage.create(copy);
                                            }
                                        },
                                        no:{
                                            label:game.i18n.localize("SMALLW.No"),
                                            icon: `<i class="fas fa-times"></i>`,
                                            callback: () => {}
                                        }
                                    },
                                    default: '',
                                    close:() => {}
                                });
                                dlg.render(true);
                            }
                        }
                    }
                    await ChatMessage.create(chatData);
                    return resolve(true)
                })
                .fail(async function(result){
                        if(option){
                            return resolve(false)
                        }else{
                            let title =  game.i18n.localize("SMALLW.CantBeTrans");
                            let content = `<p>${game.i18n.localize("SMALLW.ErrorTechnicalProblem")}<br>${game.i18n.localize("SMALLW.ErrorWithoutTranslation")}</p><br><br><textarea readonly>${copy.content}</textarea>`;
                            await failpop(result, chatData = copy, title, content);
                        }
                    }
                )
            })()});
            game.user.setFlag("small-world", "translatable", true);
            return back
        }
    }
}

async function failpop(result, chatData, title, content){
    console.error(result);
    const dlg = new Dialog({
        title:title,
        content: content,
        buttons:{
            yes:{
                label:game.i18n.localize("SMALLW.Yes"),
                icon: `<i class="fas fa-check"></i>`,
                callback: () => {
                    ChatMessage.create(chatData);
                    return true;
                }
            },
            no:{
                label:game.i18n.localize("SMALLW.No"),
                icon: `<i class="fas fa-times"></i>`,
                callback: () => {return true}
            }
        },
        default: '',
        close:() => {return false}
    });
    dlg.render(true);

}

async function awaitpop(packet, title, content){
    const dlg = new Dialog({
        title:title,
        content: content,
        buttons:{
            yes:{
                label:game.i18n.localize("SMALLW.OriginalText"),
                icon: `<i class="fas fa-check"></i>`,
                callback: () => {
                    ChatMessage.create(packet.data.copy);
                    return false;
                }
            },
            check:{
                label:game.i18n.localize("SMALLW.CheckExecute"),
                icon: `<i class="fas fa-search"></i>`,
                callback: async () => {
                    game.socket.emit('module.small-world', packet);
                }
            },
            no:{
                label:game.i18n.localize("SMALLW.Withdraw"),
                icon: `<i class="fas fa-times"></i>`,
                callback: () => {return true}
            }
        },
        default: '',
        close:() => {return false}
    });
    dlg.render(true);
}

async function awaitself(data, copy){
    const dlg = new Dialog({
        title: game.i18n.localize("SMALLW.AwaitSend"),
        content: `<p>${game.i18n.localize("SMALLW.AwaitSendContent")}<br>${game.i18n.localize("SMALLW.AwaitSendSelect")}</p><br><br>${game.i18n.localize("SMALLW.OriginalText")}:<br><textarea readonly>${copy.content}</textarea>`,
        buttons:{
            force:{
                label:game.i18n.localize("SMALLW.Force"),
                icon: `<i class="fas fa-bomb"></i>`,
                callback: () => {
                    createTranslation({...data});
                    return true;
                }
            },
            check:{
                label:game.i18n.localize("SMALLW.CheckExecute"),
                icon: `<i class="fas fa-search"></i>`,
                callback: async () => {
                    let status = await game.user.getFlag("small-world", "translatable");
                    if(status){
                        createTranslation({...data});
                        return true;
                    }else{
                        awaitself(data, copy);
                        return false;
                    }
                }
            },
            no:{
                label:game.i18n.localize("SMALLW.Withdraw"),
                icon: `<i class="fas fa-times"></i>`,
                callback: () => {return false}
            }
        },
        default: '',
        close:() => {return false}
    });
    dlg.render(true);
}

async function getDeepltranslate(text, API_KEY, API_URL, userLanguage, transLang){
    var defer = $.Deferred();
    $.ajax({
        type:"POST",
        url:API_URL,
        data:{
            "auth_key": API_KEY,
            "text": text,
            "source_lang": userLanguage.toUpperCase(),
            "target_lang": transLang,
        },
        traditional: true,
        dataType: "json",
        success:function(data){
            defer.resolve(data);
        },
        error:function(data){
            defer.reject(data);
        }
    })
    return defer.promise(this);
}

async function getOriginalFontCode(text){
    let out = [];
    for(let i = 0;i < text.length; i++){
        let c = await Code.b64encode(text[i]);
        let d = await Code.b64encode(c);
        d = d.substr(3);
        d = d.replace(/\=/g, "")
        var  l = d.split("");
        var space = [];
        let t = true
        let n=0;
        while (t){
            n = getRandomIntInclusive(1, 9);
            if(l.length > t) t = false;
        }
        while (l.length > n){
            let a = l.splice(0, n);
            space.push(a)
            n = getRandomIntInclusive(1, 9);
        }
        space.push(l)
        let e = getRandomIntInclusive(0, 1);
         e += Math.round(text[i].length / 3);
        space = space.splice(0, e);
        let f = "";
        for(let j =0 ; j < space.length; j++){
            f += space[j].join('');
            if(j != (space.length - 1)) f+= " "
        }
        out.push(f)
    }
    return out
}

async function getMstranslate(senddata, API_KEY, API_URL){
    var defer = $.Deferred();
    $.ajax({
        type: "POST",
        url: API_URL,
        headers:{
            "Ocp-Apim-Subscription-Key": API_KEY,
            "Content-Type": "application/json; charset=UTF-8"
        },
        dataType: "json",
        data: senddata,
        success:function(data){
            defer.resolve(data);
        },
        error:function(data){
            defer.reject(data);
        }
    })
    return defer.promise(this);
}

async function getDeeplCount(){
    let code = await game.settings.get("small-world", "deeplunseenkey");
    let decode = await Code.decode(code);
    let pro = await game.settings.get("small-world", "deeplpro");
    const API_KEY = decode;
    let url;
    if(pro){
        url = 'https://api.deepl.com/v2/usage';
    }else{
        url = 'https://api-free.deepl.com/v2/usage';
    }
    const API_URL = url;
    await $.ajax({
        type:"GET",
        url:API_URL,
        data:{
            "auth_key": API_KEY,
        },
        dataType: "json"
    })
    .done(async function(data){
        await game.settings.set("small-world", "translateDeeplCount", {count: data.character_count, limit: data.character_limit})
    })
    .fail(async function(data){
        console.error(data)
    })
}

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * @author      toshi (https://github.com/k08045kk)
 * @license     MIT License | https://opensource.org/licenses/MIT
 * @version     2
 * @since       1 - 20211215 - 初版
 * @since       2 - 20220328 - fix 「'」「"」をタグ名・属性名に使用できる
 * @since       2 - 20220328 - fix 全角スペースをタグ名・属性名に使用できる
 * @since       2 - 20220328 - fix 属性の途中に「"'」を含むことがある
 * @see         https://www.bugbugnow.net/2021/12/tokenize-parse-html.html
 * @param {string} html - 生テキストのHTML
 * @param {Object} [option={}] - オプション
 * @param {boolean} option.trim - タグ間の空白を削除する
 * @return {string[]} - 分解した文字列
 */
function htmlTokenizer(html, option={}) {
    const stack = [];
  
    let lastIndex = 0;
    const findTag = /<[!/A-Za-z][^\t\n\f\r />]*([\t\n\f\r /]+[^\t\n\f\r /][^\t\n\f\r /=]*([\t\n\f\r ]*=([\t\n\f\r ]*("[^"]*"|'[^']*'|[^\t\n\f\r >]*)))?)*[\t\n\f\r /]*>/g;
    for (let m; m=findTag.exec(html); ) {
      if (lastIndex < m.index) {
        let text = html.substring(lastIndex, m.index);
        if (option.trim) { text = text.trim(); }
        if (text.length > 0) { stack.push(text); }
      }
      lastIndex = findTag.lastIndex;
  
      let tag = m[0];
      if (option.trim) { tag = tag.trim(); }
      stack.push(tag);
    }
    return stack;
}