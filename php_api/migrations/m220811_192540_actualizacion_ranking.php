<?php

use yii\db\Migration;

class m220811_192540_actualizacion_ranking extends Migration
{

    public function safeUp()
    {
      $this->addColumn('fotoclub_ranking', 'puntaje_temporada', $this->integer());
      $this->addColumn('fotoclub_ranking', 'premios_temporada', $this->text(1024));
      $this->addColumn('fotoclub_ranking', 'porc_efectividad_anual', $this->text(1024));

      $this->createTable('profiles_ranking_category_section', [
        'id'                => $this->primaryKey(),
        'profile_id'        => $this->integer()->notNull(),
        'name'              => $this->text(),
        'section_id'        => $this->integer()->notNull(),
        'category_id'       => $this->integer()->notNull(),
        'puntaje_temporada' => $this->integer()->notNull(),
        'score_total'       => $this->integer()->notNull(),
        'prizes'            => $this->text(1024),
        'premios_temporada' => $this->text(1024),
      ]);

      $this->addForeignKey(
        'profiles_ranking_category_section_profile_id',
        'profiles_ranking_category_section',
        'profile_id',
        'profile',
        'id'
      );
      $this->addForeignKey(
        'profiles_ranking_category_section_section_id',
        'profiles_ranking_category_section',
        'section_id',
        'section',
        'id'
      );
      $this->addForeignKey(
        'profiles_ranking_category_section_category_id',
        'profiles_ranking_category_section',
        'category_id',
        'category',
        'id'
      );
    }

    public function safeDown()
    {
        echo "m220811_192540_actualizacion_ranking cannot be reverted.\n";

        return false;
    }

}
