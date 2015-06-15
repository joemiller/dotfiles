a=$(osascript -e 'try
tell app "SystemUIServer"
set answer to text returned of (display dialog "Enter YubiKey PIN" default answer "")
end
end
activate app (path to frontmost application as text)
answer' | tr '\r' ' ')
echo $a
[[ -z "$a" ]] && exit

