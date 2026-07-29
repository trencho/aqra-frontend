export const translations = {
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
                previous meteorological values obtained from an external API (DarkSky and OpenWeather).',
      usedTechnologiesContent:
        'Operating system: CentOS 7 - Database: MongoDB - Web Framework: Vue.js \
                (frontend) - Flask (backend) - Application server: Gunicorn - Web server: NGINX (reverse proxy) \
                - Virtualization: Docker - Orchestration: Kubernetes',
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
            метеоролошки вредности добиени од надворешно API (DarkSky и OpenWeather).',
      usedTechnologiesContent:
        'Оперативен систем: CentOS 7 - База на податоци: MongoDB - Web Framework: \
                Vue.js (frontend) - Flask (backend) - Апликациски сервер: Gunicorn - Веб сервер: NGINX (reverse \
                proxy) - Виртуелизација: Docker - Оркестрација: Kubernetes',
    },
  },
};
