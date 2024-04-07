# MMM-euro2024

a Magic Mirror Module to display Euro 2024 fixtures and standings

## PREREQUISITES

create an account https://www.football-data.org/ and obtain your token.  
Add the token to the module's [configuration](#configuration) (replace it with `[YOUR_TOKEN]`)

## INSTALLATION

This 3rd party module install just like any other.  
This Magic Mirror Forum thread describe a step-by-step procedure to install: [How to add modules. For absolute beginners.](https://forum.magicmirror.builders/topic/4231/how-to-add-modules-for-absolute-beginners?_=1622723520331)

## CONFIGURATION

the default configuration looks like this:

```js
{
  disabled: false,
  module: 'MMM-euro2024',
  position: 'center',
  header: 'Euro 2024',
  config: {
    updateInterval: 60 * 1000,
    token: [YOUR_TOKEN]
  }
},
```

**BE AWARE OF THE REQUEST LIMIT FOR THE FREE TIER OF THE API**

## SCREENSHOT

![MMM-euro2024](MMM-euro2024.png)
