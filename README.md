# nansen
nansen automation written in typescript

• клонируем репозиторий
git clone https://github.com/yamolchu/nansen

• переходим в него 
cd nansen/

• указываем свой CapMonster API key в inputs/config.ts RecaptchaV2TaskKey.

• добавляем outlook почты  в inputs/emails.txt в формате example@example.com:парольпочты

•добавляем socks5 прокси в inputs/proxies.txt в формате username:password:ip:port

• устанавливаем зависимости
yarn

• запускаем 
yarn start
