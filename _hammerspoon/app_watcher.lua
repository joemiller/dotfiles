-- Callback function for application events
--

local log = hs.logger.new('app_watcher','debug')

local laptopScreen = "Color LCD"

function apps(appName, eventType, appObject)
    if (eventType == hs.application.watcher.activated) then
        if (appName == "Finder") then
            -- Bring all Finder windows forward when one gets activated since finder does not do this on its own
            appObject:selectMenuItem({"Window", "Bring All to Front"})
        end
    end

    if (eventType == hs.application.watcher.launched) then
        log.df("appname: %s", appName)
        if (appName == "Spotify") then
            -- always move Spotify to the laptop screen (Color LCD) and make it fullscreen, since Spotify
            -- still hasn't figured out how to remember the fullscreen setting
            local win = appObject:mainWindow()
            win:moveToScreen(laptopScreen)
            win:setFullScreen(true)
        end

        if (appName == "Evernote") then
            -- always move Evernote to the laptop screen (Color LCD) and make it fullscreen
            os.execute("sleep 3")
            local win = appObject:mainWindow()
            log.df("evernote launched, win: %s", win)
            win:moveToScreen(laptopScreen)
            win:setFullScreen(true)
        end

        if (appName == "Slack") then
            -- always move Slack to the laptop screen (Color LCD) and make it fullscreen
            -- TODO: at some point the behavior changed and the return from mainWindow() becomes nil unless
            --       we briefly wait for slack to start. Instead of shelling out to sleep we should come up
            --       with a better solution here.
            os.execute("sleep 5")
            local win = appObject:mainWindow()
            win:moveToScreen(laptopScreen)
            win:setFullScreen(true)
        end
    end
end

appWatcher = hs.application.watcher.new(apps)
appWatcher:start()
