# Open-Polls
Open-Polls - это сайт для создания своих опросов с открытым исходным кодом.
Для удобства на сайте доступна авторизация через ВК аккаунт. Сайт доступен на
русском и английском языках. При разработке были использованы Vue.js,
Bootstrap, TypeScript, Express, i18n и другое.

## Скриншоты
<img src="https://i.imgur.com/K7Yf0YO.png" height="320" /> <img src="https://i.imgur.com/6qazBLN.png" height="320" />
<img src="https://i.imgur.com/t3kVNI2.png" height="320" /> <img src="https://i.imgur.com/AyxN6y8.png" height="320" />

## Установка и запуск
Для работы сайта требуется приложение ВК. Его вы можете создать здесь https://dev.vk.com/.
Для запуска вам понадобится установленный [Node.js](https://nodejs.org),
менеджер пакетов **npm**(устанавливается вместе с Node.js) и СУБД [PostgreSQL](https://www.postgresql.org/).
Скачайте и распакуйте этот репозиторий. После этого откройте командную строку и перейдите в его директорию.

Теперь создадим базу данных в PostgreSQL. Введите в консоли следующее:
```
psql --username postgres
```
Это откроет клиент для работы с СУБД. После он попросит вас авторизоваться.
Следующей командой создайте базу данных:
```
CREATE DATABASE название_базы_данных;
```
Теперь закройте клиент командой `\q`

Введите по очереди следующие команды для установки всех необходимых пакетов:
```
npm install
npm --prefix backend install
npm --prefix frontend install
```
После необходимо создать **.env** файл в директории **backend**. Этот файл содержит некоторые переменные среды, используемые для настройки сервера.
Пример содержания файла:
```
SECRET=Случайно сгенерированная подпись
VK_CLIENT_ID=ID приложения в ВК
VK_SECRET=Защищенный ключ приложения в ВК
DB_HOST=Имя хоста базы данных (по умолчанию localhost)
DB_PORT=Порт для подключенния к БД (по умолчанию 5432)
DB_NAME=Название БД
DB_USERNAME=Имя пользователя для подключения к БД. Используйте, например, postgres
DB_PASSWORD=Пароль пользователя
FORCE_SYNC=Используется в целях отладки. Для простого запуска оставьте значение false
```
Далее для сборки введите следующую команду:
```
npm run build
```
Теперь запустите сервер:
```
npm run start
```
Готово. Вы можете открыть сайт по ссылке http://localhost:5000

## Описание формата JSON объектов
- User  
	Объект пользователя
	```
	{
		"id": идентификатор пользователя,
		"name": имя пользователя,
		"registrationDate": дата регистрации в строковом формате
	}
	```
- Post  
	Объект поста на сайте
	```
	{
		"id": идентификатор поста,
		"title": заголовок поста,
		"author": объект пользователя автора,
		"isPublished": опубликован ли пост (булевое значение),
		"creationDate": дата создания в строковом формате,
		"editingDate": дата последнего изменения,
		"polls": список опросов
	}
	```
- Poll  
	Объект опроса
	```
	{
		"id": идентификатор опроса,
		"name": название опроса,
		"style": номер стиля опроса (от 0 до 2),
		"options": массив строк вариантов ответа опроса,
		"results": массив чисел, указывающих на кол-во данных ответов на каждый из вариантов (может быть пустым),
		"answersCount": кол-во уникальных пользователей, которые дали ответ на опрос,
		"maxChosenOptionsCount": макс. кол-во выбранных вариантов ответа
	}
	```
- PollOptionChoice
	Объект выбора варианта ответа пользователем
	```
	{
		"pollId": идентификатор опроса,
		"optionIndex": индекс выбранного ответа
	}
	```

## Описание методов API
Сайт использует собственный REST API для общения фронтенда и бэкенда. Ниже перечисленны его методы.
Ответы от сервера всегда приходят в JSON формате.
- `auth/login`  
	Метод авторизации на сайте. Необходимо переадресовывать пользователя на эту страницу.
	Далее сервер переадресует на страницу авторизации ВКонтакте. После пользователя переадресует на главную страницу,
	либо по ссылке, указанной в URL параметре `redirect_path`
- `auth/logout`  
	Метод для выхода пользователя с сайта. Для его работы необходимо отправить GET запрос.
	Если все пройдет успешно, то сервер вернет пустой JSON объект.
- `auth/user`  
	Метод для получения данных о текущем авторизованном пользователе.
	Допускается только GET запрос. Ответ приходит в следующем формате:
	```
	{
		"user": объект пользователя
		"photo": строка с URL фотографии страницы пользователя
	}
	```
- `api/post`  
	Метод для взаимодействия с постами на сайте. Далее перечисленны все его поддерживаемые HTTP методы.
	- GET  
	Возвращает данные о посте. Авторизация не требуется. Необходимо указать в URL запросе параметр
	`id` - идентификатор поста.
	Формат ответа:
	```
	{
		"post": объект поста
	}
	```
	- POST  
	Создает новый пост. Необходима авторизация. Тело запроса должно содержать JSON объект поста (формат указан выше).
	Необходимо передать только поля **title** и **polls**.
	- PUT  
	Метод обновления существующего поста. Требует авторизацию. Тело запроса должно содержать JSON объект поста.
	Необходимо передать поля: **id**, **title**, **polls**
	- DELETE  
	Метод удаления поста. Требуется авторизация. Необходимо указать в URL запросе параметр **id** - идентификатор поста, который необходимо удалить.
- `api/set_post_publishing_state`  
	Метод для изменения поля isPublished. Необходимо указать параметры запроса **id** - идентификатор поста и **is_published** - значение.
- `api/post_option_choices`  
	- GET  
	Получить свои варианты ответа на пост. Необходимо указать параметр запроса **post_id** - идентификатор поста.
	Формат ответа:
	```
	{
		"postOptionsChoices": список объектов варианта ответа (формат указан выше)
	}
	```
	- POST  
	Опубликовать свои варианты ответа на пост. Формат тела запроса:
	```
	{
		"postId": идентификатор поста,
		"postOptionsChoices": список вариантов ответа
	}
	```
- `api/my_posts`  
	Метод получения своих постов. Допускается только GET запрос. Формат ответа:
	```
	{
		"posts": список объектов постов (содержит только поля id, title, isPublished, creationDate, editingDate)
	}
	```