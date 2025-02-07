<!doctype html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!--link rel="stylesheet" type="text/css" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css"-->
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.1.0/css/all.css" integrity="sha384-lKuwvrZot6UHsBSfcMvOkWwlCMgc0TaWr+30HWe3a4ltaBwTZhyTEggF5tJv8tbt" crossorigin="anonymous">
    <link rel="stylesheet" type="text/css" href="/css/map/app.css">
    <link rel="shortcut icon" href="/images/favicon.ico" type="image/x-icon" />

    <script>
        window.__env = {
            mapShareBaseUrl: '{{ config('map.share.base_url') }}',
            surveyUrl: '{{ config('map.survey_url') }}'
        }
    </script>

    <script type="text/javascript" src="/js/map/app.js"></script>

    <title>@yield('title')</title>
</head>
<body>
<div>
    @yield('content')
    @include('footer')
    @yield('scripts')
</div>
</body>
</html>
