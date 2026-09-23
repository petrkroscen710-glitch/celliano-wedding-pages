<?php
/** Celliano — own website enquiry endpoint. No secrets or client data in the repository. */
declare(strict_types=1);
header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header('X-Content-Type-Options: nosniff');

function finish(int $code, string $status): never {
    http_response_code($code);
    if ($code === 303) {
        header('Location: /kontakt/?stav=' . rawurlencode($status) . '#poptavka', true, 303);
        exit;
    }
    echo '<!doctype html><html lang="cs"><meta charset="utf-8"><meta name="robots" content="noindex"><title>Celliano – poptávka</title><body><main style="max-width:38rem;margin:5rem auto;padding:1rem;font:1.1rem/1.6 sans-serif"><h1>Odeslání poptávky</h1><p>' . htmlspecialchars($status, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p><p><a href="/kontakt/#poptavka">Zpět na formulář</a> · <a href="mailto:celliano@seznam.cz">Napsat e-mail</a></p></main></body></html>';
    exit;
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    finish(405, 'Tato adresa přijímá pouze odeslání formuláře.');
}
if (isset($_SERVER['CONTENT_LENGTH']) && (int) $_SERVER['CONTENT_LENGTH'] > 16000) {
    finish(413, 'Zpráva je příliš dlouhá.');
}
$host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
$origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
if ($origin !== '') {
    $originHost = strtolower((string) parse_url($origin, PHP_URL_HOST));
    if ($originHost === '' || $originHost !== explode(':', $host)[0]) {
        finish(403, 'Formulář lze odeslat pouze z webu Celliano.');
    }
}
// Quietly reject bot-filled honeypot. No message is sent.
if (trim((string) ($_POST['web'] ?? '')) !== '') {
    finish(303, 'odeslano');
}
function field(string $name, int $max): string {
    $value = $_POST[$name] ?? '';
    if (!is_string($value) || strlen($value) > $max * 4) {
        finish(303, 'chyba');
    }
    $value = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $value));
    if (mb_strlen($value, 'UTF-8') > $max) {
        finish(303, 'chyba');
    }
    return $value;
}
$name = field('jmeno', 110);
$email = field('email', 254);
$phone = field('telefon', 40);
$type = field('typ', 100);
$date = field('datum', 30);
$place = field('misto', 180);
$timeChoice = field('cas_volba', 10);
$customTime = field('cas_vlastni', 5);
$message = field('zprava', 3500);
if ($name === '' || $email === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n]/', $email)) {
    finish(303, 'chyba');
}
// Never trust browser-only validation: accept only the published presets or a valid custom HH:MM.
$timePresets = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00'];
if ($timeChoice === 'vlastni') {
    if (!preg_match('/\A(?:[01][0-9]|2[0-3]):[0-5][0-9]\z/D', $customTime)) {
        finish(303, 'chyba');
    }
    $startTime = $customTime;
} elseif ($timeChoice === '') {
    $startTime = 'Zatím neurčeno';
} elseif (in_array($timeChoice, $timePresets, true)) {
    $startTime = $timeChoice;
} else {
    finish(303, 'chyba');
}
// Limit repeat submissions without saving enquiry content or visitor IP in plain text.
$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$rateFile = sys_get_temp_dir() . '/celliano-enquiry-' . hash('sha256', $ip . '|celliano-v1') . '.lock';
$handle = @fopen($rateFile, 'c+');
if ($handle === false || !flock($handle, LOCK_EX)) {
    finish(303, 'chyba');
}
$history = json_decode((string) stream_get_contents($handle), true);
$history = is_array($history) ? array_values(array_filter($history, static fn($t) => is_int($t) && $t > time() - 3600)) : [];
if (count($history) >= 3 || ($history !== [] && time() - end($history) < 45)) {
    flock($handle, LOCK_UN);
    fclose($handle);
    finish(303, 'limit');
}
$body = "Nová poptávka z webu Celliano\n\n" .
    "Jméno: {$name}\nE-mail: {$email}\nTelefon: {$phone}\nTyp akce: {$type}\nDatum: {$date}\nČas začátku: {$startTime}\nMísto: {$place}\n\nZpráva:\n{$message}\n";
$subject = '=?UTF-8?B?' . base64_encode('Nová poptávka – Celliano') . '?=';
$headers = ['MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8', 'Reply-To: ' . $email];
// Hostinger's configured sender is used unless a verified sender is set server-side.
$sender = (string) (getenv('CELLIANO_MAIL_FROM') ?: '');
if ($sender !== '' && filter_var($sender, FILTER_VALIDATE_EMAIL) && !preg_match('/[\r\n]/', $sender)) {
    $headers[] = 'From: ' . $sender;
}
$accepted = @mail('celliano@seznam.cz', $subject, $body, implode("\r\n", $headers));
if ($accepted) {
    $history[] = time();
    rewind($handle);
    ftruncate($handle, 0);
    fwrite($handle, json_encode($history));
    fflush($handle);
}
flock($handle, LOCK_UN);
fclose($handle);
finish(303, $accepted ? 'prijato' : 'chyba');
