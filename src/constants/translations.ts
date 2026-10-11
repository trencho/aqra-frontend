import type { LocaleId } from './locales';

/**
 * One locale's messages. Flat under `common` -- there is only one namespace.
 *
 * The index signature is required, not decorative: vue-i18n's LocaleMessage is
 * an indexable type, and without it createI18n's overload resolution fails on
 * `messages` and then silently falls back to the legacy (non-Composition)
 * signature, which reports `i18n.global.locale` as a plain string.
 */
interface Messages {
  common: Record<string, string>;
  [namespace: string]: Record<string, string>;
}

/**
 * Note the contact address is escaped as `{'@'}`, not a bare `@`.
 *
 * vue-i18n 9+ reads a bare `@` as linked-message syntax and throws
 * `Invalid linked format` at runtime while the build stays green. Two tests in
 * __tests__/translations.spec.js pin this; do not "tidy" it.
 *
 * The Record<LocaleId, ...> annotation means adding a locale to LocaleId
 * without adding its messages here is a compile error.
 */
export const translations: Record<LocaleId, Messages> = {
  en: {
    common: {
      welcomeTo: 'Welcome to',
      aqra: 'AQRA',
      aboutMe: 'About me',
      projectInfo: 'Project info',
      pollutionMap: 'Pollution map',
      home: 'Home',
      statistics: 'Statistics',
      swaggerDocumentation: 'Swagger documentation',
      description: 'Description',
      usedTechnologies: 'Used technologies',
      skopje: 'Skopje',
      filters: 'Filters',
      showForecastForAllCities: 'Show heat map for all cities',
      showForecastForAllSensors: 'Show heat map for all sensors',
      showCityMarkers: 'Show city markers',
      showCityBoundaries: 'Show city boundaries',
      showSensorMarkers: 'Show sensor markers',
      pollutants: 'Pollutants',
      cityName: 'City name',
      sensors: 'Sensors',
      clickHere: 'Click here',
      getInTouch: 'Get in touch',
      email: "trenche{'@'}feit.ukim.edu.mk",
      linkedIn: 'LinkedIn',
      mail: 'Mail',
      gitHub: 'GitHub',
      showStatistics: 'Show statistics',
      dismiss: 'Dismiss',
      // Accessible names. These are read aloud but never displayed, so they
      // describe the control's purpose rather than repeating nearby visible text.
      aqraLogo: 'AQRA logo',
      scrollToTop: 'Scroll to top',
      backgroundImage: 'Polluted city skyline',
      portrait: 'Portrait of the author',
      mapLabel: 'Interactive air quality map of North Macedonia',
      legend: 'Legend',
      hourOfDay: 'Hour of day',
      previousHour: 'Previous hour',
      nextHour: 'Next hour',
      playTimeline: 'Play the 24-hour timeline',
      pauseTimeline: 'Pause the timeline',
      pollutantHelp: 'Choose value in order to see the map',
      pollutantStatisticHelp:
        'Choose value in order to see the statistics of the past week',
      aboutMeContent:
        "Hey there, my name is Aleksandar Trenchevski, but everybody calls me Trenche, so you can \
            too. My current location is in Skopje, Macedonia, where I work as a software engineer. My hobbies are \
            gaming, bike rides, hiking and trying out different projects and technologies in my spare time to satisfy \
            my enthusiasm for programming. I graduated and earned both of my bachelor's and master's degree at the \
            Faculty of Electrical Engineering and Information Technologies. My primary occupation now is working as a \
            backend developer, trying out DevOps technologies, studying machine learning concepts and working on \
            small game projects for competitions. AQRA began as a project out of curiosity for machine \
            learning and developing models for predicting pollution based on weather characteristics within a certain \
            area since this topic is a big deal here in Macedonia. While working on the project, I have gained \
            experience on many technologies that are used in the present for small and enterprise applications. This \
            is still a work in progress. However, for now I am only maintaining the current implementation and am \
            available for suggestions and feedback from both end-users and developers that wish to use the visual part \
            of the application and the REST API for developing their own applications.",
      descriptionContent:
        'AQRA - Air Quality REST API predicts air pollution using regression models based on \
                machine learning. In addition to the forecast, data can be retrieved for the cities and sensors \
                obtained from pulse.eco for which those forecasts are performed, as well as a historical archive of \
                previous meteorological values obtained from an external API (OpenWeather).',
      usedTechnologiesContent:
        'Operating system: CentOS 7 - Database: MongoDB - Web Framework: Vue.js \
                (frontend) - Flask (backend) - Application server: Gunicorn - Web server: NGINX (reverse proxy) \
                - Virtualization: Docker - Orchestration: Kubernetes',
    },
    legal: {
      draftBanner: 'Draft: pending review by FEIT/UKIM',
      draftBannerDetail:
        'FEIT/UKIM has not approved this text yet. It may change before publication.',
      version: 'Version {version}',
      versionDraft: 'Version {version} (draft)',
      lastUpdated: 'Last updated: {date}',
      otherDocuments: 'Policies and statements',
      links: 'Links',
      changesHeading: 'Changes',
      privacyTitle: 'Privacy policy',
      privacySummary:
        'What AQRA records when you visit this site or call its API, and why.',
      privacyControllerHeading: 'Who is responsible',
      privacyController:
        'The controller is the Faculty of Electrical Engineering and Information Technologies (FEIT) at Ss. Cyril and Methodius University in Skopje (UKIM). FEIT hosts aqra.feit.ukim.edu.mk.',
      privacyContact: 'Privacy contact: [FEIT DPO contact].',
      privacyNotCollectedHeading: 'What we do not collect',
      privacyNotCollected:
        'AQRA has no accounts, no forms and no analytics. The site sets no cookies and stores nothing in your browser.',
      privacyLogsHeading: 'Server logs',
      privacyLogs:
        "Each time your browser requests a page or the API, the web servers record your IP address, the time, the request, the response status, the referring page and your browser's user agent. If you call the API with coordinates, those coordinates appear in the request.",
      privacyLogsPurpose:
        'We use these logs to operate the service and keep it secure.',
      privacyLogsRetention:
        'Retention: set by the hosting platform; [retention period to be confirmed by FEIT].',
      privacyLegalBasis: 'Legal basis: [to be confirmed by FEIT].',
      privacyRateLimitHeading: 'Rate limiting',
      privacyRateLimit:
        'The API counts requests per IP address to stop abuse. It holds the address in memory for at most one hour and never writes it to disk.',
      privacyAppLog:
        "The application's own log records job results and errors. It contains no IP addresses.",
      privacyThirdPartiesHeading: 'Other services your browser contacts',
      privacyMapTiles:
        "The map images come straight from the OpenStreetMap tile servers (tile.openstreetmap.org). When the map loads, those servers receive your IP address and the details your browser sends with any request. The OpenStreetMap Foundation's privacy policy covers those requests.",
      privacyFirstParty:
        'Everything else, including fonts and the API documentation, loads from aqra.feit.ukim.edu.mk.',
      privacyNoSharing:
        'We do not sell or share visitor data. The API sends no visitor data to pulse.eco or OpenWeather.',
      privacyRightsHeading: 'Your rights',
      privacyRights:
        "Under North Macedonia's Law on Personal Data Protection (ZZLP) and, for visitors in the EU, the GDPR, you can ask to see your data, to correct it or to erase it, and you can object to its processing. Write to the privacy contact above.",
      privacyComplaint:
        'You can also lodge a complaint with the Personal Data Protection Agency of North Macedonia.',
      privacyChanges:
        'We will update this policy before any feature that stores data ships. The date at the top shows the current version.',
      termsTitle: 'Terms of use',
      termsSummary: 'The rules for using the AQRA site and API.',
      termsServiceHeading: 'The service',
      termsService:
        'AQRA is a free, non-commercial academic service run by FEIT at UKIM.',
      termsApiHeading: 'Using the API',
      termsApi:
        'You may call the API from your own applications. Each client may make up to 60 requests a minute and 1000 an hour.',
      termsApiLimit:
        'The API refuses requests above those limits until the window resets.',
      termsWarrantyHeading: 'No warranty',
      termsWarranty:
        'The site, the API and the data come as is, without warranty of any kind. They may be unavailable, late or wrong.',
      termsLiability:
        'To the extent the law permits, FEIT and UKIM are not liable for any loss caused by using the service or its data.',
      termsLicencesHeading: 'Licences',
      termsCodeLicence:
        'The frontend code is released under the MIT licence and the backend code under the Apache License 2.0.',
      termsDataLicence:
        'The data keeps the licences of its sources. The data sources page lists them.',
      termsLawHeading: 'Governing law',
      termsLaw: 'The laws of North Macedonia govern these terms.',
      termsChanges:
        'We may change these terms. The date at the top shows the current version.',
      cookiesTitle: 'Cookies and storage',
      cookiesSummary: 'AQRA stores nothing on your device.',
      cookiesNoneHeading: 'What we store',
      cookiesNone: 'The site uses no cookies.',
      cookiesNoStorage:
        'It does not use localStorage, sessionStorage or any other browser storage.',
      cookiesApi: 'The API sets no cookies either.',
      cookiesNoBanner:
        'Because nothing is stored, the site shows no consent banner.',
      cookiesThirdPartyHeading: 'Map tiles',
      cookiesThirdParty:
        "The map loads images from OpenStreetMap's tile servers. The privacy policy explains what they receive.",
      cookiesChanges:
        'We will update this page before any feature that stores data on your device ships, such as an offline cache or remembering your location.',
      dataSourcesTitle: 'Data sources',
      dataSourcesSummary: "Where AQRA's data comes from and under which terms.",
      sourcePulseHeading: 'Air quality: pulse.eco',
      sourcePulse:
        'Air-quality readings come from pulse.eco, a crowdsourced network of sensors. pulse.eco gives no guarantee that its data is correct.',
      sourcePulseTerms:
        'The terms for reusing pulse.eco data are being confirmed.',
      sourceWeatherHeading: 'Weather: OpenWeather',
      sourceWeather: 'Weather data © OpenWeather.',
      sourceWeatherLicence:
        'OpenWeather licenses this data under the Open Database License (ODbL).',
      sourceMapHeading: 'Map: OpenStreetMap',
      sourceMap:
        'Map data © OpenStreetMap contributors, available under the Open Database License (ODbL).',
      sourceForecastHeading: 'Forecasts',
      sourceForecast:
        "AQRA's own models compute the forecasts from the data above. The disclaimer explains their limits.",
      disclaimerTitle: 'Disclaimer',
      disclaimerSummary: 'What AQRA forecasts can and cannot tell you.',
      disclaimerForecastHeading: 'Forecasts are estimates',
      disclaimerForecast:
        'AQRA forecasts come from statistical models. They are estimates and can be wrong.',
      disclaimerHealth:
        'Do not use AQRA to make health, safety or medical decisions.',
      disclaimerDataHeading: 'Data as is',
      disclaimerData:
        'All data is provided as is, without warranty. Sensors can fail or go offline, and readings can arrive late.',
      disclaimerOfficialHeading: 'Official sources',
      disclaimerOfficial:
        'For air-quality alerts and health advice, follow the official sources.',
      accessibilityTitle: 'Accessibility statement',
      accessibilitySummary:
        'How accessible AQRA is and how to report a barrier.',
      accessibilityTargetHeading: 'Our target',
      accessibilityTarget:
        'AQRA aims to meet the Web Content Accessibility Guidelines (WCAG) 2.1 at level AA.',
      accessibilityLimitsHeading: 'Known limitations',
      accessibilityLimitColour:
        "The map's heat layer shows pollution levels by colour. A legend maps the colours to values, but the map itself offers no text alternative for each area.",
      accessibilityContactHeading: 'Report a barrier',
      accessibilityContact:
        "If something on the site blocks you, email trenche{'@'}feit.ukim.edu.mk or open an issue on GitHub.",
      accessibilityDateHeading: 'About this statement',
      accessibilityDate: 'We prepared this statement on 2026-10-11.',
      linkOsmfPrivacy: 'OpenStreetMap Foundation privacy policy',
      linkFrontendCode: 'AQRA frontend source code (MIT)',
      linkBackendCode: 'AQRA backend source code (Apache-2.0)',
      linkPulse: 'pulse.eco',
      linkOpenWeather: 'OpenWeather',
      linkOdbl: 'Open Database License (ODbL)',
      linkOsmCopyright: 'OpenStreetMap copyright and licence',
      linkMoepp:
        'Ministry of Environment and Physical Planning: air quality in North Macedonia',
      linkEea: 'European Environment Agency: European Air Quality Index',
      linkIssues: 'AQRA issues on GitHub',
    },
    footer: {
      legalNav: 'Site information',
      credits: 'Data credits',
      weather: 'Weather data © OpenWeather',
      airQuality: 'Air-quality data: pulse.eco',
      map: '© OpenStreetMap contributors',
    },
  },
  mk: {
    common: {
      welcomeTo: 'Добредојдовте на',
      aqra: 'AQRA',
      aboutMe: 'За мене',
      projectInfo: 'Информации за проектот',
      pollutionMap: 'Мапа на загаденост',
      home: 'Почетна',
      statistics: 'Статистики',
      swaggerDocumentation: 'Swagger документација',
      description: 'Краток опис',
      usedTechnologies: 'Користени технологии',
      skopje: 'Скопје',
      filters: 'Филтри',
      showForecastForAllCities: 'Прикажи топлинска мапа за сите градови',
      showForecastForAllSensors: 'Прикажи топлинска мапа за сите сензори',
      showCityMarkers: 'Покажи ги градовите',
      showCityBoundaries: 'Покажи ги границите на градот',
      showSensorMarkers: 'Прикажи ги сензорите',
      pollutants: 'Загадувачи',
      cityName: 'Име на град',
      sensors: 'Сензори',
      clickHere: 'Кликни тука',
      getInTouch: 'Стапи во контакт',
      email: "trenche{'@'}feit.ukim.edu.mk",
      linkedIn: 'LinkedIn',
      mail: 'Mail',
      gitHub: 'GitHub',
      showStatistics: 'Прикажи ја статистиката',
      dismiss: 'Отфрли',
      aqraLogo: 'Лого на AQRA',
      scrollToTop: 'Врати се на врвот',
      backgroundImage: 'Панорама на загаден град',
      portrait: 'Портрет на авторот',
      mapLabel:
        'Интерактивна мапа на квалитетот на воздухот во Северна Македонија',
      legend: 'Легенда',
      hourOfDay: 'Час од денот',
      previousHour: 'Претходен час',
      nextHour: 'Следен час',
      playTimeline: 'Пушти ја 24-часовната временска линија',
      pauseTimeline: 'Паузирај ја временската линија',
      pollutantHelp: 'Одберете загадувач за да ја видите топлинската мапа',
      pollutantStatisticHelp:
        'Одберете загадувач за дa видите статисктичка состојба за изминатата недела',
      aboutMeContent:
        'Здраво! Јас сум Александар Тренчевски, но сите ме викаат Тренче, па можете и вие. \
            Моментално сум во Скопје, Македонија, каде што работам како софтверски инженер.\
      Во слободно време играм игри, возам точак, се качувам на планини и испробувам нови проекти и технологии за да \
      го задоволам мојот ентузијазам за програмирање. Дипломирав и магистрирав на Факултетот за електротехника и \
      информациски технологии во Скопје. Моментално работам како backend девелопер, но се испробувам и на DevOps \
      полето, ги изучувам концептите за машинско учење и работам на мали проекти за изработка на игри. AQRA \
      е продукт на мојот интерес за машинско учење и градење на модели за предвидување на загаденоста базирана на \
      временските карактеристки во рамки на определена област, бидејќи ова е исклучително важна тема во Македонија. \
      Работејќи на проектов, се здобив до искуство и знаење за повеќе технологии кој се користат денес во \
      индустријата. Ова е сеуште работа во прогрес, но за сега работам на одржување на сегашната имплементација и сум \
      заитересиран за feedback и предлози од страна на корисниците и програмерите кои сакаат да видат визуелен приказ \
      на апликацијата и REST API-то за да може да отпочнат и сопствени апликации',
      descriptionContent:
        'Air Quality REST API предвидува воздушно загадување со помош на регресивни модели \
            базирани на машинско учење. Покрај предвидување може да се повлечат податоци за градовите и сензорите \
            добиени од pulse.eco за кои што се извршуваат тие предвидувања како и историска архива на претходни \
            метеоролошки вредности добиени од надворешно API (OpenWeather).',
      usedTechnologiesContent:
        'Оперативен систем: CentOS 7 - База на податоци: MongoDB - Web Framework: \
                Vue.js (frontend) - Flask (backend) - Апликациски сервер: Gunicorn - Веб сервер: NGINX (reverse \
                proxy) - Виртуелизација: Docker - Оркестрација: Kubernetes',
    },
    legal: {
      draftBanner: 'Нацрт: се чека преглед од ФЕИТ/УКИМ',
      draftBannerDetail:
        'ФЕИТ/УКИМ сè уште не го одобрил овој текст. Може да се промени пред објавувањето.',
      version: 'Верзија {version}',
      versionDraft: 'Верзија {version} (нацрт)',
      lastUpdated: 'Последна измена: {date}',
      otherDocuments: 'Политики и изјави',
      links: 'Врски',
      changesHeading: 'Измени',
      privacyTitle: 'Политика за приватност',
      privacySummary:
        'Што бележи AQRA кога ја посетувате страницата или го повикувате API-то, и зошто.',
      privacyControllerHeading: 'Кој е одговорен',
      privacyController:
        'Контролор е Факултетот за електротехника и информациски технологии (ФЕИТ) при Универзитетот „Св. Кирил и Методиј“ во Скопје (УКИМ). ФЕИТ го хостира aqra.feit.ukim.edu.mk.',
      privacyContact: 'Контакт за приватност: [FEIT DPO contact].',
      privacyNotCollectedHeading: 'Што не собираме',
      privacyNotCollected:
        'AQRA нема кориснички сметки, формулари ниту аналитика. Страницата не поставува колачиња и не зачувува ништо во вашиот прелистувач.',
      privacyLogsHeading: 'Серверски логови',
      privacyLogs:
        'Секој пат кога вашиот прелистувач бара страница или го повикува API-то, веб-серверите ги бележат вашата IP-адреса, времето, барањето, статусот на одговорот, страницата од која доаѓате и корисничкиот агент на прелистувачот. Ако го повикате API-то со координати, тие се гледаат во барањето.',
      privacyLogsPurpose:
        'Овие логови ги користиме за работа и заштита на услугата.',
      privacyLogsRetention:
        'Рок на чување: го одредува платформата за хостирање; [рокот на чување треба да го потврди ФЕИТ].',
      privacyLegalBasis: 'Правна основа: [треба да ја потврди ФЕИТ].',
      privacyRateLimitHeading: 'Ограничување на барањата',
      privacyRateLimit:
        'API-то ги брои барањата по IP-адреса за да спречи злоупотреба. Адресата ја чува во меморија најмногу еден час и никогаш не ја запишува на диск.',
      privacyAppLog:
        'Логот на самата апликација ги бележи резултатите од задачите и грешките. Не содржи IP-адреси.',
      privacyThirdPartiesHeading:
        'Други услуги што ги контактира вашиот прелистувач',
      privacyMapTiles:
        'Сликите на мапата доаѓаат директно од серверите на OpenStreetMap (tile.openstreetmap.org). Кога мапата се вчитува, тие сервери ја добиваат вашата IP-адреса и податоците што прелистувачот ги испраќа со секое барање. За тие барања важи политиката за приватност на Фондацијата OpenStreetMap.',
      privacyFirstParty:
        'Сè друго, вклучувајќи ги фонтовите и документацијата на API-то, се вчитува од aqra.feit.ukim.edu.mk.',
      privacyNoSharing:
        'Не продаваме и не споделуваме податоци за посетителите. API-то не испраќа податоци за посетителите до pulse.eco или OpenWeather.',
      privacyRightsHeading: 'Вашите права',
      privacyRights:
        'Според Законот за заштита на личните податоци (ЗЗЛП) и, за посетителите од ЕУ, според GDPR, можете да побарате увид во вашите податоци, нивна исправка или бришење, и можете да приговорите на нивната обработка. Пишете до контактот за приватност погоре.',
      privacyComplaint:
        'Можете да поднесете и претставка до Агенцијата за заштита на личните податоци.',
      privacyChanges:
        'Ќе ја ажурираме оваа политика пред да објавиме која било функција што зачувува податоци. Датумот на врвот ја покажува тековната верзија.',
      termsTitle: 'Услови за користење',
      termsSummary: 'Правилата за користење на страницата и API-то на AQRA.',
      termsServiceHeading: 'Услугата',
      termsService:
        'AQRA е бесплатна, некомерцијална академска услуга на ФЕИТ при УКИМ.',
      termsApiHeading: 'Користење на API-то',
      termsApi:
        'API-то можете да го повикувате од сопствени апликации. Секој клиент може да испрати до 60 барања во минута и до 1000 барања на час.',
      termsApiLimit:
        'API-то ги одбива барањата над овие граници додека не истече периодот.',
      termsWarrantyHeading: 'Без гаранција',
      termsWarranty:
        'Страницата, API-то и податоците се даваат такви какви што се, без никаква гаранција. Може да бидат недостапни, задоцнети или погрешни.',
      termsLiability:
        'Во мерата во која законот дозволува, ФЕИТ и УКИМ не одговараат за штета настаната од користењето на услугата или нејзините податоци.',
      termsLicencesHeading: 'Лиценци',
      termsCodeLicence:
        'Кодот на фронтендот е објавен под лиценцата MIT, а кодот на бекендот под Apache License 2.0.',
      termsDataLicence:
        'Податоците ги задржуваат лиценците на своите извори. Страницата за извори на податоци ги наведува.',
      termsLawHeading: 'Меродавно право',
      termsLaw: 'За овие услови важат законите на Северна Македонија.',
      termsChanges:
        'Овие услови може да ги измениме. Датумот на врвот ја покажува тековната верзија.',
      cookiesTitle: 'Колачиња и складирање',
      cookiesSummary: 'AQRA не зачувува ништо на вашиот уред.',
      cookiesNoneHeading: 'Што зачувуваме',
      cookiesNone: 'Страницата не користи колачиња.',
      cookiesNoStorage:
        'Не користи localStorage, sessionStorage ниту друго складирање во прелистувачот.',
      cookiesApi: 'Ниту API-то поставува колачиња.',
      cookiesNoBanner:
        'Бидејќи ништо не се зачувува, страницата не прикажува банер за согласност.',
      cookiesThirdPartyHeading: 'Плочки на мапата',
      cookiesThirdParty:
        'Мапата вчитува слики од серверите на OpenStreetMap. Политиката за приватност објаснува што добиваат тие сервери.',
      cookiesChanges:
        'Ќе ја ажурираме оваа страница пред да објавиме која било функција што зачувува податоци на вашиот уред, на пример офлајн кеш или паметење на вашата локација.',
      dataSourcesTitle: 'Извори на податоци',
      dataSourcesSummary:
        'Од каде доаѓаат податоците на AQRA и под кои услови.',
      sourcePulseHeading: 'Квалитет на воздухот: pulse.eco',
      sourcePulse:
        'Мерењата на квалитетот на воздухот доаѓаат од pulse.eco, мрежа на сензори што ја градат граѓаните. pulse.eco не гарантира дека податоците се точни.',
      sourcePulseTerms:
        'Условите за повторна употреба на податоците од pulse.eco сè уште се потврдуваат.',
      sourceWeatherHeading: 'Временски услови: OpenWeather',
      sourceWeather: 'Временски податоци © OpenWeather.',
      sourceWeatherLicence:
        'OpenWeather ги лиценцира овие податоци под Open Database License (ODbL).',
      sourceMapHeading: 'Мапа: OpenStreetMap',
      sourceMap:
        'Податоци за мапата © соработници на OpenStreetMap, достапни под Open Database License (ODbL).',
      sourceForecastHeading: 'Прогнози',
      sourceForecast:
        'Прогнозите ги пресметуваат моделите на AQRA од горенаведените податоци. Нивните ограничувања се објаснети во одрекувањето од одговорност.',
      disclaimerTitle: 'Одрекување од одговорност',
      disclaimerSummary:
        'Што можат и што не можат да ви кажат прогнозите на AQRA.',
      disclaimerForecastHeading: 'Прогнозите се проценки',
      disclaimerForecast:
        'Прогнозите на AQRA доаѓаат од статистички модели. Тие се проценки и може да бидат погрешни.',
      disclaimerHealth:
        'Не користете го AQRA за одлуки поврзани со здравје, безбедност или медицина.',
      disclaimerDataHeading: 'Податоци такви какви што се',
      disclaimerData:
        'Сите податоци се даваат такви какви што се, без гаранција. Сензорите може да откажат или да се исклучат, а мерењата може да доцнат.',
      disclaimerOfficialHeading: 'Официјални извори',
      disclaimerOfficial:
        'За предупредувања за квалитетот на воздухот и здравствени совети следете ги официјалните извори.',
      accessibilityTitle: 'Изјава за пристапност',
      accessibilitySummary:
        'Колку е пристапен AQRA и како да пријавите пречка.',
      accessibilityTargetHeading: 'Нашата цел',
      accessibilityTarget:
        'AQRA има за цел да ги исполни Упатствата за пристапност на веб-содржините (WCAG) 2.1 на ниво AA.',
      accessibilityLimitsHeading: 'Познати ограничувања',
      accessibilityLimitColour:
        'Топлинскиот слој на мапата ги прикажува нивоата на загаденост со бои. Легендата ги поврзува боите со вредности, но самата мапа нема текстуална алтернатива за секоја област.',
      accessibilityContactHeading: 'Пријавете пречка',
      accessibilityContact:
        "Ако нешто на страницата ви пречи, пишете на trenche{'@'}feit.ukim.edu.mk или отворете пријава (issue) на GitHub.",
      accessibilityDateHeading: 'За оваа изјава',
      accessibilityDate: 'Оваа изјава ја подготвивме на 2026-10-11.',
      linkOsmfPrivacy: 'Политика за приватност на Фондацијата OpenStreetMap',
      linkFrontendCode: 'Изворен код на фронтендот на AQRA (MIT)',
      linkBackendCode: 'Изворен код на бекендот на AQRA (Apache-2.0)',
      linkPulse: 'pulse.eco',
      linkOpenWeather: 'OpenWeather',
      linkOdbl: 'Open Database License (ODbL)',
      linkOsmCopyright: 'Авторски права и лиценца на OpenStreetMap',
      linkMoepp:
        'Министерство за животна средина и просторно планирање: квалитет на воздухот во Северна Македонија',
      linkEea:
        'Европска агенција за животна средина: Европски индекс за квалитет на воздухот',
      linkIssues: 'Пријави за AQRA на GitHub',
    },
    footer: {
      legalNav: 'Информации за страницата',
      credits: 'Извори на податоци',
      weather: 'Временски податоци © OpenWeather',
      airQuality: 'Податоци за квалитетот на воздухот: pulse.eco',
      map: '© соработници на OpenStreetMap',
    },
  },
};
