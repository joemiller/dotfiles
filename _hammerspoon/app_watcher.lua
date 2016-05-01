-- Callback function for application events
--

function apps(appName, eventType, appObject)
  if (eventType == hs.application.watcher.activated) then
    if (appName == "Finder") then
      -- Bring all Finder windows forward when one gets activated since finder does not do this on its own
      appObject:selectMenuItem({"Window", "Bring All to Front"})
    end
  end
end

appWatcher = hs.application.watcher.new(apps)
appWatcher:start()
