<?php

use yii\db\Migration;

/**
 * Class m211224_134515_inserts
 */
class m211224_134515_inserts extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->insert('category',  [ 'id'  => 1, 'name' => 'Estímulo' ]);
        $this->insert('category',  [ 'id'  => 2, 'name' => 'Primera etapa' ]);
        $this->insert('category',  [ 'id'  => 3, 'name' => 'Principiante' ]);
        
        $this->insert('section',  [ 'id'  => 1, 'name' => 'Monocromo' ]);
        $this->insert('section',  [ 'id'  => 2, 'name' => 'Color' ]);
        $this->insert('section',  [ 'id'  => 3, 'name' => 'Travel' ]);

        $this->insert('fotoclub',  [ 'id'  => 1, 'name' => 'El Portal De Tandil' ]);
        $this->insert('fotoclub',  [ 'id'  => 2, 'name' => 'Juarez Fotoclub' ]);
        $this->insert('fotoclub',  [ 'id'  => 3, 'name' => 'Necochea Fotoclub' ]);
        $this->insert('fotoclub',  [ 'id'  => 4, 'name' => 'Olavarría Fotoclub' ]);
        $this->insert('fotoclub',  [ 'id'  => 5, 'name' => 'Fotobar Necochea' ]);

        $this->insert('role',  [ 'id'  => 1, 'type' => 'Administrador' ]);
        $this->insert('role',  [ 'id'  => 2, 'type' => 'Delegado' ]);
        $this->insert('role',  [ 'id'  => 3, 'type' => 'Concursante' ]);
        $this->insert('role',  [ 'id'  => 4, 'type' => 'Juez' ]);

        $this->insert('profile',  [ 'id'  => 1, 'name' => 'administrador', 'last_name' => 'base', 'fotoclub_id' => 2 ]);
        $this->insert('profile',  [ 'id'  => 2, 'name' => 'delegado', 'last_name' => 'base', 'fotoclub_id' => 2 ]);
        $this->insert('profile',  [ 'id'  => 3, 'name' => 'concursante', 'last_name' => 'base', 'fotoclub_id' => 1 ]);

        $this->insert('user',  [ 'id'  => 1, 'username' => 'admin', 'password_hash' => '$2y$10$HTR60gXWuY9z93MPWz1jwu58Oqfys2pu3uxl6IiRvjYPUxpLzYFIu', 'password_reset_token' => Null, 'access_token' => 'ewrg(//(/FGtygvTCFR%&45fg6h7tm6tg65dr%RT&H/(O_O', 'created_at' => NULL, 'updated_at' => NULL, 'status' => 1, 'role_id' => 1, 'profile_id' => 1 ]);
        $this->insert('user',  [ 'id'  => 2, 'username' => 'concursante', 'password_hash' => '$2y$10$HTR60gXWuY9z93MPWz1jwu58Oqfys2pu3uxl6IiRvjYPUxpLzYFIu', 'password_reset_token' => Null, 'access_token' => 'ewrg(//(/FGtygvTCFR%&45fg6h7tm6tg65dr%RT&H/(O_O', 'created_at' => NULL, 'updated_at' => NULL, 'status' => 1, 'role_id' => 3, 'profile_id' => 3 ]);
        $this->insert('user',  [ 'id'  => 3, 'username' => 'delegado', 'password_hash' => '$2y$10$HTR60gXWuY9z93MPWz1jwu58Oqfys2pu3uxl6IiRvjYPUxpLzYFIu', 'password_reset_token' => Null, 'access_token' => 'ewrg(//(/FGtygvTCFR%&45fg6h7tm6tg65dr%RT&H/(O_O', 'created_at' => NULL, 'updated_at' => NULL, 'status' => 1, 'role_id' => 2, 'profile_id' => 2 ]);
        
        $this->insert('contest',  [ 'id'  => 1, 'name' => 'Concurso 1', 'description' => 'Esto es una descripción', 'start_date' => '2021-10-23T00:00:00', 'end_date' => '2025-12-23T03:00:00' ]);
        
        $this->insert('contest_section',  [ 'id'  => 1, 'contest_id' => 1, 'section_id' => 1 ]);
        $this->insert('contest_section',  [ 'id'  => 2, 'contest_id' => 1, 'section_id' => 2 ]);
        $this->insert('contest_section',  [ 'id'  => 3, 'contest_id' => 1, 'section_id' => 3 ]);

        $this->insert('contest_category',  [ 'id'  => 1, 'contest_id' => 1, 'category_id' => 1 ]);
        $this->insert('contest_category',  [ 'id'  => 2, 'contest_id' => 1, 'category_id' => 2 ]);
        $this->insert('contest_category',  [ 'id'  => 3, 'contest_id' => 1, 'category_id' => 3 ]);
        
        $this->insert('profile_contest',  [ 'id'  => 1, 'profile_id' => 3, 'contest_id' => 1, 'category_id' => 1 ]);

        $this->insert('image',  [ 'id'  => 1, 'code' => '#123', 'title' => '123', 'profile_id' => 3, 'url' => '' ]);

        $this->insert('metric',  [ 'id'  => 1, 'prize' => '1° Premio', 'score' => 13 ]);

        $this->insert('contest_result',  [ 'id'  => 1, 'metric_id' => 1, 'image_id' => 1, 'contest_id' => 1, 'section_id' => 3 ]);

    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        echo "m211224_134515_inserts cannot be reverted.\n";

        return false;
    }

}
