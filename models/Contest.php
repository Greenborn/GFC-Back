<?php

namespace app\models;

use Yii;
use yii\web\UploadedFile;

/**
 * This is the model class for table "contest".
 *
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property date|null $start_date
 * @property date|null $end_date
 *
 * @property ContestCategory[] $contestCategories
 * @property ContestResult[] $contestResults
 * @property ContestSection[] $contestSections
 * @property ProfileContest[] $profileContests
 */
class Contest extends \yii\db\ActiveRecord
{
    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'contest';
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            [['name'], 'required'],
            [['description'], 'string'],
            [['name', 'img_url', 'rules_url'], 'string', 'max' => 45],
            [['start_date', 'end_date'], 'string', 'max' => 33],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function attributeLabels()
    {
        return [
            'id' => 'ID',
            'name' => 'Name',
            'description' => 'Description',
            'start_date' => 'Start Date',
            'end_date' => 'End Date',
        ];
    }

    public function beforeDelete() {
        if (!empty($this->img_url) && file_exists($this->img_url)) {
            unlink($this->img_url);
            // echo 'se elimnó la img';
        }
        if (!empty($this->rules_url) && file_exists($this->rules_url)) {
            unlink($this->rules_url);
            // echo 'se elimnó la img';
        }
        return true;
    }

    public function beforeSave($insert) {

        $params = Yii::$app->getRequest()->getBodyParams();
        
        $image = UploadedFile::getInstanceByName('image_file');
        $rules = UploadedFile::getInstanceByName('rules_file');

        if (isset($image)) {
            // cargar img y sobrescribir la url
            // $tipo   = $image->type;
            // $tamano = $image->size;
            // $temp   = $image->tempName;
            // validar img
            $date     = new \DateTime();
            $img_name = normalizer_normalize(strtolower( preg_replace('/\s+/', '_', $this->name))) . '-img-' . $date->getTimestamp();
            $full_path = 'images/' . $img_name .  '.' . $image->extension;

            if (!$insert) {
                if (!empty($this->img_url) && file_exists($this->img_url)) {
                    unlink($this->img_url);
                    $this->img_url = '';
                    // echo 'se elimnó la img';
                } else {
                    // echo 'no se elimnó la img';
                }
            }

            $image->saveAs($full_path);
            $this->img_url = $full_path;

        } else {
            // no se cargó la imagen
        }
        if (isset($rules)) {
            // cargar img y sobrescribir la url
            // $tipo   = $rules->type;
            // $tamano = $rules->size;
            // $temp   = $rules->tempName;
            // validar pdf
            $date     = new \DateTime();
            $rules_name = normalizer_normalize(strtolower( preg_replace('/\s+/', '_', $this->name))) . '-rules-' . $date->getTimestamp();
            $full_path = 'images/' . $rules_name .  '.' . $rules->extension;

            if (!$insert) {
                if (!empty($this->rules_url) && file_exists($this->rules_url)) {
                    unlink($this->rules_url);
                    $this->rules_url = '';
                    // echo 'se elimnó la img';
                } else {
                    // echo 'no se elimnó la img';
                }
            }

            $rules->saveAs($full_path);
            $this->rules_url = $full_path;

        } else {
            // no se cargó el pdf
        }
      
        
      
        return parent::beforeSave($insert);
      
      }
    /**
     * Gets query for [[ContestCategories]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getContestCategories()
    {
        return $this->hasMany(ContestCategory::className(), ['contest_id' => 'id']);
    }
    public function getCategories()
    {
        return $this->hasMany(Category::className(), ['id' => 'category_id'])
            ->via('contestCategories');
            // ->viaTable('contest_category', ['contest_id' => 'id']);
    }

    /**
     * Gets query for [[ContestResults]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getContestResults()
    {
        return $this->hasMany(ContestResult::className(), ['contest_id' => 'id']);
    }
    public function getCountContestResults(): int
    {
        $data = $this->getContestResults();
        $u = Yii::$app->user->identity;
        if ($u->role_id == 2) {// delegado
            $data = $data->where(['in', 'image.profile_id', Profile::find()->select('id')->where(['fotoclub_id' => $u->profile->fotoclub_id])])->joinWith('image');
        }
        return intval($data->count());
    }

    /**
     * Gets query for [[ContestSections]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getContestSections()
    {
        return $this->hasMany(ContestSection::className(), ['contest_id' => 'id']);
    }

    public function getSections()
    {
        return $this->hasMany(Section::className(), ['id' => 'section_id'])->via('contestSections');
            // ->viaTable('contest_section', ['contest_id' => 'id']);
    }

    /**
     * Gets query for [[ProfileContests]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getProfileContests()
    {
        return $this->hasMany(ProfileContest::className(), ['contest_id' => 'id']);
    }
    public function getCountProfileContests(): int
    {
        $data = $this->getProfileContests();
        $u = Yii::$app->user->identity;
        if ($u->role_id == 2) {// delegado
            $data = $data->where(['in', 'profile_id', Profile::find()->select('id')->where(['fotoclub_id' => $u->profile->fotoclub_id])]);
        }
        return intval($data->count());
    }


    public function getActive(): bool
    {
        return date_diff(date_create($this->end_date), date_create())->invert == 1 ? true : false;
    }


    public function fields() {
        $fields = parent::fields();

        
        // expand por default
        // unset(  $fields['image_id'],
        //         $fields['metric_id']
        //      );
        $fields[] = 'active'; 

        return $fields;
    }
    public function extraFields() {
        return [ 
            'contestSections',      'sections',
            'contestCategories',    'categories',
            'contestResults',       'countContestResults',
            'profileContests',      'countProfileContests'
        ];
    }
}
