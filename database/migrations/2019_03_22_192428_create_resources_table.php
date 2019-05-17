<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateResourcesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::dropIfExists('resources');

        Schema::create('resources', function (Blueprint $table) {
            $table->bigIncrements('ResourceID');
            $table->string('NetID');
            $table->string("FirstName");
            $table->string("LastName");
            $table->integer("MaxHoursPerWeek");
            $table->unique('NetID');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('resources');
    }
}
