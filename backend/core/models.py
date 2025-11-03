# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class Animais(models.Model):
    animal_id = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=255, blank=True, null=True)
    sexo = models.CharField(max_length=1, blank=True, null=True)
    idade = models.IntegerField(blank=True, null=True)
    foto = models.TextField(blank=True, null=True)
    tipo = models.CharField(max_length=10, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'animais'


class AuthGroup(models.Model):
    name = models.CharField(unique=True, max_length=150)

    class Meta:
        managed = False
        db_table = 'auth_group'


class AuthGroupPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)
    permission = models.ForeignKey('AuthPermission', models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_group_permissions'
        unique_together = (('group', 'permission'),)


class AuthPermission(models.Model):
    name = models.CharField(max_length=255)
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING)
    codename = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'auth_permission'
        unique_together = (('content_type', 'codename'),)


class AuthUser(models.Model):
    password = models.CharField(max_length=128)
    last_login = models.DateTimeField(blank=True, null=True)
    is_superuser = models.IntegerField()
    username = models.CharField(unique=True, max_length=150)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.CharField(max_length=254)
    is_staff = models.IntegerField()
    is_active = models.IntegerField()
    date_joined = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'auth_user'


class AuthUserGroups(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_user_groups'
        unique_together = (('user', 'group'),)


class AuthUserUserPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    permission = models.ForeignKey(AuthPermission, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_user_user_permissions'
        unique_together = (('user', 'permission'),)


class DjangoAdminLog(models.Model):
    action_time = models.DateTimeField()
    object_id = models.TextField(blank=True, null=True)
    object_repr = models.CharField(max_length=200)
    action_flag = models.PositiveSmallIntegerField()
    change_message = models.TextField()
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING, blank=True, null=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'django_admin_log'


class DjangoContentType(models.Model):
    app_label = models.CharField(max_length=100)
    model = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'django_content_type'
        unique_together = (('app_label', 'model'),)


class DjangoMigrations(models.Model):
    id = models.BigAutoField(primary_key=True)
    app = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    applied = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_migrations'


class DjangoSession(models.Model):
    session_key = models.CharField(primary_key=True, max_length=40)
    session_data = models.TextField()
    expire_date = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_session'


class Entrevista(models.Model):
    entrevista_id = models.AutoField(primary_key=True)
    data_field = models.DateField(db_column='data_')  # Field renamed because it ended with '_'.
    observacoes = models.CharField(max_length=255, blank=True, null=True)
    processo_etapa = models.ForeignKey('ProcessoEtapa', models.DO_NOTHING, db_column='processo_etapa')

    class Meta:
        managed = False
        db_table = 'entrevista'


class EtapaRelacao(models.Model):
    etapa_relacao_id = models.AutoField(primary_key=True)
    template = models.ForeignKey('Template', models.DO_NOTHING, db_column='template')
    etapa = models.ForeignKey('Etapas', models.DO_NOTHING, db_column='etapa')
    responsavel = models.ForeignKey('TipoUsuario', models.DO_NOTHING, db_column='responsavel')
    proximo = models.ForeignKey('self', models.DO_NOTHING, db_column='proximo', blank=True, null=True)
    alternativo = models.ForeignKey('self', models.DO_NOTHING, db_column='alternativo', related_name='etaparelacao_alternativo_set', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'etapa_relacao'


class Etapas(models.Model):
    etapa_id = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'etapas'


class Processo(models.Model):
    processo_id = models.AutoField(primary_key=True)
    template = models.ForeignKey('Template', models.DO_NOTHING, db_column='template')
    usuario = models.ForeignKey('Usuarios', models.DO_NOTHING, db_column='usuario')
    status_field = models.CharField(db_column='status_', max_length=255)  # Field renamed because it ended with '_'.

    class Meta:
        managed = False
        db_table = 'processo'


class ProcessoEtapa(models.Model):
    processo_etapa_id = models.AutoField(primary_key=True)
    processo = models.ForeignKey(Processo, models.DO_NOTHING, db_column='processo')
    etapa_relacao = models.ForeignKey(EtapaRelacao, models.DO_NOTHING, db_column='etapa_relacao')
    status_field = models.CharField(db_column='status_', max_length=255)  # Field renamed because it ended with '_'.
    usuario = models.ForeignKey('Usuarios', models.DO_NOTHING, db_column='usuario')

    class Meta:
        managed = False
        db_table = 'processo_etapa'


class Recusa(models.Model):
    recusa_id = models.AutoField(primary_key=True)
    justificativa = models.CharField(max_length=255, blank=True, null=True)
    processo_etapa = models.ForeignKey(ProcessoEtapa, models.DO_NOTHING, db_column='processo_etapa')

    class Meta:
        managed = False
        db_table = 'recusa'


class Solicitacao(models.Model):
    solicitacao_id = models.AutoField(primary_key=True)
    processo_etapa = models.ForeignKey(ProcessoEtapa, models.DO_NOTHING, db_column='processo_etapa')
    cpf = models.CharField(max_length=255)
    animal = models.ForeignKey(Animais, models.DO_NOTHING, db_column='animal')
    comprovante_residencia = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'solicitacao'


class Template(models.Model):
    template_id = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'template'


class TipoUsuario(models.Model):
    tipo_id = models.AutoField(primary_key=True)
    categoria = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'tipo_usuario'


class Usuarios(models.Model):
    usuario_id = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=255, blank=True, null=True)
    idade = models.IntegerField(blank=True, null=True)
    email = models.CharField(max_length=255, blank=True, null=True)
    senha = models.CharField(max_length=255, blank=True, null=True)
    tipo_usuario = models.ForeignKey(TipoUsuario, models.DO_NOTHING, db_column='tipo_usuario', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'usuarios'


class Validacao(models.Model):
    validacao_id = models.AutoField(primary_key=True)
    descricao = models.CharField(max_length=255, blank=True, null=True)
    etapa_relacao = models.ForeignKey(EtapaRelacao, models.DO_NOTHING, db_column='etapa_relacao')

    class Meta:
        managed = False
        db_table = 'validacao'


class Visitacao(models.Model):
    visitacao_id = models.AutoField(primary_key=True)
    data_field = models.DateField(db_column='data_')  # Field renamed because it ended with '_'.
    endereco = models.CharField(max_length=255)
    processo_etapa = models.ForeignKey(ProcessoEtapa, models.DO_NOTHING, db_column='processo_etapa')

    class Meta:
        managed = False
        db_table = 'visitacao'
