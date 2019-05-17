<?php
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Request;
/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

/** Displays initial webpage */
Route::view('/', 'app');
Route::view('/resource', 'app');
Route::view('/individual_resource/{id}', 'app');
Route::view('/add_res_to_project/{projectID}', 'app');
Route::view('/individual_project/{projectId}', 'app');
Route::view('/projects_list', 'app');