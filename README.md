# Small world
Small world is a Foundry VTT (version 9 and 10) mod that uses DeepL and the Microsoft Translator API to allow instant translation of chats.  
It also has the ability to randomly create notations in the language of yout imaginary worlds without communicating with the API.  
(Note that this is done by encryption and has no grammatical rules.Use it to improve the mood of the place.)  
Two APIs can be used for each user, or other users can delegate translations to their GM user if the user with GM permissions has registered two APIs (world setting, disabled by default).  
Simultaneously translate from one language to two different languages, and the display of the translation results can be configured for each user.
 (e.g., you: as is, game master: as is, user 2: first foreign language, user 3: second foreign language, etc.)

  
  
## News(v0.1.4～)
In addition to the already supported English and Japanese, small-world now supports the display of French, Spanish, German, Italian, Simplified Chinese[^1], and Swedish.
The translation was done using DeepL and may not reproduce the nuances correctly.
If any experts in the respective languages have suggestions for corrections, please send us a pull request!
  
  
  
## Note
- **Please note that I do not take any responsibility or liability for any damage or loss caused through my mod.**
- It may interfere with other mods that use the chat field, so use caution when doing so.
- Each of the encrypted language fonts are available for personal and commercial use, but may have their own restrictions on rights notices and scope. Please be sure to check the rights notices of each font before reusing the results.
- Do not share the key for each API (risk of unauthorized use of translated resources, etc.).
- Some rights to the text of the resulting translation may reside with the respective translation API. When using the translation results beyond the scope of personal use, please check the rights notice of each API and use the translation results in compliance with that notice.
- The DeepL and Microsoft Translator APIs can be used for free or charged for. Small world recommends using the free version of the APIs. If you choose to use the paid version of the APIs, this mod will still work, but you are responsible for managing your usage limits and usage status.
- This mod is a beta version and many bugs may remain. If you see a bug, we would appreciate it if you could help us out.
  
  
## Installation Instructions
To install and use the Small world mod for Foundry Virtual Tabletop, simply paste the following URL into the 
**Install Module** dialog on the Setup menu of the application.

https://github.com/AdmiralNyar/small-world/raw/master/module.json

  
## Function
If this mod is enabled, a button and select box will appear between the chat log and the input field (if activated without problems).   This section describes the chat input fields and the buttons and boxes that appear.

- **Encryption (local) or DeepL (API) or Microsoft Translator (API)**(Button): Each time the button here is clicked, it changes the available translation (encryption) functions in order from DeepL, Microsoft Translator, and Encryption. Each time you change, the choice in the select box next to it will automatically change as well (once changed, the selection in the select box before the change will be cleared and the value will be "Target language").The same user retains the last state even after reloading or re-logging in.

- **Translation on/off**(Button): If this button is not turned on (glowing red), no translation will be done.The same user retains the last state even after reloading or re-logging in.

- **Settings for each user**(Button): You can register to change the language of the chat messages displayed for each user in that world (Independent registration for each user). By default, everyone is in your first language. When a world is loaded, the registration contents here and the user information (id and name) are checked to add unregistered users and delete the registration contents of users who no longer exist. It should be noted that users added after a particular chat has been sent cannot see that chat. If you plan to add users in the middle of a chat, be sure to add that many users from the beginning beforehand.The same user retains the last state even after reloading or re-logging in.

- **Target language**(Select box): The options switch according to the status of the leftmost button. The default choice when that button is toggled is "Target language". In the "Target language" state, no translation is possible and an error popup will be displayed.

  

## Module Settings
- **Deepl api authentication key**: The authentication key is located within your account settings at DeepL. If you suspect it has been lost or misused, delete and recreate it from within your account settings at DeepL. When saving your game settings, it will test the connection, so if you get an error, try re-entering the key.

- **Do you use DeepL api Pro?**: Check here if you want to use DeepL API Pro.

- **Deepl's limit**: The DeepL API free version has a cap of 500,000 characters per month; Pro does not, but it is pay-as-you-go, so please check your usage accordingly. You can freely change the value of the limit in the input field here. If you change it so that no value is entered, the value will automatically be entered for the DeepL API limit of -1000 characters.The current monthly count of the number of characters translated per month receives data from the DeepL API side, so the ability to reset the count like Microsoft Translator does not exist in this mod.

- **Microsoft api secret key**: Authentication keys are located on the Translator "key and endpoint" in Azure Cognitive Services. It can be either Key 1 or Key 2. If you suspect it has been lost or misused, delete it from the key and endpoint and recreate it (periodic recreation is recommended). A connection test is performed when saving the game setup, so if an error occurs, try re-entering the key. Also, make sure the Translator resource location/region is set to "global".

- **Microsoft translator's limit**: The free version of Microsoft Translator has a monthly limit of 2 million characters, otherwise it is pay-as-you-go, in which case please check your usage accordingly. You can freely change the upper limit in the input field here: DeepL Unlike the API, we do not automatically obtain the upper limit from the server side, so please do not delete the input value completely.

- **Reset the count of Microsoft Translator's translated characters?**: Unlike DeepL, the API key alone is not enough to check Microsoft Translator usage. If you are using the free version, please reset the count of the number of characters you have translated (0) each time the month changes. If you are a pay-as-you-go user, you should check the "Metrics" of Translator in Azure Cognitive Services frequently and (or) recreate the key every time you stop using it to be aware of it.

- **Outsource the translation to the active GM (world)**: If a user with GM privileges and two APIs available is active, everyone else in the "world" will delegate translations to that user (using their own API if both are available). Translating another user's text could consume a great deal of the translation API's resources. If you use this feature, please manage the translation resources of each API closely.If your first foreign language is encrypted and your second foreign language is also encrypted, you will not be entrusted with the work, but will handle it yourself.

- **Don't detect user language**: This feature prevents the language of the source text from being automatically detected. When disabled, the source language is set if a contraction on the API's list of possible languages (e.g., en, jp, zh-Hans, etc.) matches a contraction in the user's Foundry VTT language setting. This prevents the API from mis-detecting similar languages and resulting in incorrect translations.

- **Bilingal mode**: Normally, the translation is done only in the language below the chat field (first language), but if this field is enabled, the translation will be done simultaneously in the language specified in the second language below. Except in the case of encryption, this doubles the amount of translation and thus doubles the resource consumption of the translation API. Please be careful to manage the resources of the translation API.

- **Select second language**: A list of second languages that make sense when "bilingual mode" is enabled one level above.  Note that an error message will be displayed if you leave the "Please select" option when the bilingual mode is enabled.

- **Limit functionality on double-click + shift-key (world)**: Normally, the target language can be changed by shift + double-clicking on the content of a chat message that someone has translated using "Small world" (e.g., source language => first foreign language => second foreign language => language). Enabling this field allows only users with GM privileges to use the shift-key + double-click function, which is useful, for example, when recreating first contact with an unknown race or the collapse of the Tower of Babel with the small-world string encryption function. (When disabled, all users can also see the contents of the chat before disabling the shift key + double-click function.)



## Licence
### Fonts
The fonts used in this mod are composed of the following great fonts. 
**I would like to take this opportunity to thank the creators of these fonts for providing them and making them widely available.**

- **Nishiki-teki**:
    * Link: https://umihotaru.work
    * created by: [うみほたる](https://twitter.com/umihotarus)
    * License: [Text(in Japanese)](https://umihotaru.work/faq.txt)

- **Voynich-1.23-webfont**:
    * Link: https://fontlibrary.org/en/font/voynich
    * created by: William Porquet 
    * License: Public Domain

- **MadronaRegular-Mjav**:
    * Link: https://www.fontspace.com/madrona-font-f32720
    * Created by: Pixel Kitchen
    * License: Public Domain

- **EvokenRegular-axxp5**:
    * Link: https://www.fontspace.com/evoken-font-f40854
    * Created by: Pixel Kitchen
    * License: Public Domain

- **GavelkSerif-Regular**:
    * Link: https://ichijosoya.wixsite.com/soyaworkshop/fantasy-font
    * Created by: [Copyright (c) 2020,  “一条創弥 / SOYA_one”](https://twitter.com/SOYA_1st)
    * License: [This Font Software is licensed under the SIL Open Font License, Version 1.1.](http://scripts.sil.org/OFL)

- **OldGavelkSerif**:
    * Link: https://ichijosoya.wixsite.com/soyaworkshop/fantasy-font
    * Created by: [Copyright (c) 2020,  “一条創弥 / SOYA_one”](https://twitter.com/SOYA_1st)
    * License: [This Font Software is licensed under the SIL Open Font License, Version 1.1.](http://scripts.sil.org/OFL)

- **Divinish**:
    * Link: https://ichijosoya.wixsite.com/soyaworkshop/fantasy-font
    * Created by: [Copyright (c) 2020,  “一条創弥 / SOYA_one”](https://twitter.com/SOYA_1st)
    * License: [This Font Software is licensed under the SIL Open Font License, Version 1.1.](http://scripts.sil.org/OFL)

- **Grasstext**:
    * Link: https://ichijosoya.wixsite.com/soyaworkshop/fantasy-font
    * Created by: [Copyright (c) 2020,  “一条創弥 / SOYA_one”](https://twitter.com/SOYA_1st)
    * License: [This Font Software is licensed under the SIL Open Font License, Version 1.1.](http://scripts.sil.org/OFL)

- **Reptilian**:
    * Link: https://ichijosoya.wixsite.com/soyaworkshop/fantasy-font
    * Created by: [Copyright (c) 2020,  “一条創弥 / SOYA_one”](https://twitter.com/SOYA_1st)
    * License: [This Font Software is licensed under the SIL Open Font License, Version 1.1.](http://scripts.sil.org/OFL)

- **Kushudian-Serif**:
    * Link: https://ichijosoya.wixsite.com/soyaworkshop/kushudian
    * Created by: [Copyright (c) 2020,  “一条創弥 / SOYA_one”](https://twitter.com/SOYA_1st)
    * License: [This Font Software is licensed under the SIL Open Font License, Version 1.1.](http://scripts.sil.org/OFL)

- **thaumatology-round**:
    * Link: https://ichijosoya.wixsite.com/soyaworkshop/thaumatology
    * Created by: [Copyright (c) 2020,  “一条創弥 / SOYA_one”](https://twitter.com/SOYA_1st)
    * License: [This Font Software is licensed under the SIL Open Font License, Version 1.1.](http://scripts.sil.org/OFL)

- **UltraCode**:
    * Link: https://ichijosoya.wixsite.com/soyaworkshop/ultracode
    * Created by: [Copyright (c) 2020,  “一条創弥 / SOYA_one”](https://twitter.com/SOYA_1st)
    * License: [This Font Software is licensed under the SIL Open Font License, Version 1.1.](http://scripts.sil.org/OFL)

- **RlyehRunesV1**:
    * Link: http://propnomicon.blogspot.com/2014/03/rlyeh-runes-version-1.html
    * Created by: Propnomicon
    * License: [Creative Commons Attribution-Noncommercial-Share Alike 3.0 Unported License.](https://creativecommons.org/licenses/by-nc-sa/3.0/)
  
  
  
[^1]:Unfortunately, DeepL does not support Traditional Chinese, only Simplified Chinese.
