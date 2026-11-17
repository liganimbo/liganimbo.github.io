# Fotos 3D de Liga Nimbo sobre una mesa, renderizadas con Blender 4.2 (Cycles). Las lanza preparar.sh.
# Uso: blender -b -P escenas.py -- <escena> <muestras> <salida.png> [escala %]
# Escenas: mesa-story, mesa-publicacion, web, presentamos-<id>, navidad, mazo.
# Las texturas (cartas en tex/, madera y luz en pbr/) las deja preparar.sh en la carpeta de trabajo, junto a este archivo.
import bpy
import bmesh
import json
import math
import os
import sys
from mathutils import Vector

AQUI = os.path.dirname(os.path.abspath(__file__))
TEX = os.path.join(AQUI, "tex")
PBR = os.path.join(AQUI, "pbr")
args = sys.argv[sys.argv.index("--") + 1 :]
nombre_escena, muestras, salida = args[0], int(args[1]), args[2]
escala = int(args[3]) if len(args) > 3 else 100
MUNDO = json.load(open(os.path.join(AQUI, "mundo.json"))) if os.path.exists(os.path.join(AQUI, "mundo.json")) else None

bpy.ops.wm.read_factory_settings(use_empty=True)
escena = bpy.context.scene
escena.render.engine = "CYCLES"
escena.cycles.device = "CPU"
escena.cycles.samples = muestras
escena.cycles.use_denoising = True
escena.render.resolution_percentage = escala
escena.render.filepath = salida
# Colores fieles a los de las cartas (AgX los lava).
escena.view_settings.view_transform = "Standard"
escena.view_settings.look = "None"
escena.view_settings.exposure = -0.3


def imagen(ruta, color=True):
    img = bpy.data.images.load(ruta, check_existing=True)
    if not color:
        img.colorspace_settings.name = "Non-Color"
    return img


def resolucion(ancho, alto):
    escena.render.resolution_x = ancho
    escena.render.resolution_y = alto


# --- Luz: una habitación con ventanas y una ventana grande a la izquierda ---------------------------------
def luz(fuerza_hdri=0.45, ventana=22, color=(1.0, 0.93, 0.84)):
    mundo = bpy.data.worlds.new("Mundo")
    escena.world = mundo
    mundo.use_nodes = True
    n = mundo.node_tree.nodes
    hdri = n.new("ShaderNodeTexEnvironment")
    hdri.image = imagen(os.path.join(PBR, "hdri.hdr"))
    mundo.node_tree.links.new(hdri.outputs["Color"], n["Background"].inputs["Color"])
    n["Background"].inputs["Strength"].default_value = fuerza_hdri
    if ventana:
        bpy.ops.object.light_add(type="AREA", location=(-0.55, 0.35, 0.75))
        v = bpy.context.object
        v.data.energy = ventana
        v.data.size = 0.9
        v.data.color = color
        v.rotation_euler = (Vector((0, 0, 0)) - v.location).to_track_quat("-Z", "Y").to_euler()


# --- Materiales -------------------------------------------------------------------------------------------
def material_imagen(nombre, ruta, rugosidad=0.42):
    m = bpy.data.materials.get(nombre)
    if m:
        return m
    m = bpy.data.materials.new(nombre)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes["Principled BSDF"]
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = imagen(ruta)
    t.interpolation = "Cubic"
    nt.links.new(t.outputs["Color"], p.inputs["Base Color"])
    p.inputs["Roughness"].default_value = rugosidad
    # Papel: un relieve muy fino.
    ruido = nt.nodes.new("ShaderNodeTexNoise")
    ruido.inputs["Scale"].default_value = 900
    relieve = nt.nodes.new("ShaderNodeBump")
    relieve.inputs["Strength"].default_value = 0.04
    nt.links.new(ruido.outputs["Fac"], relieve.inputs["Height"])
    nt.links.new(relieve.outputs["Normal"], p.inputs["Normal"])
    return m


def material_liso(nombre, color, rugosidad=0.5, ss=0.0, emision=0.0):
    m = bpy.data.materials.new(nombre)
    m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = (*color, 1)
    p.inputs["Roughness"].default_value = rugosidad
    if ss:
        p.inputs["Subsurface Weight"].default_value = ss
        p.inputs["Subsurface Radius"].default_value = (0.002, 0.002, 0.002)
    if emision:
        p.inputs["Emission Color"].default_value = (*color, 1)
        p.inputs["Emission Strength"].default_value = emision
    return m


def material_canto_mazo():
    """El canto de un mazo: muchas cartas apiladas, en rayitas finas."""
    m = bpy.data.materials.new("Canto mazo")
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes["Principled BSDF"]
    coord = nt.nodes.new("ShaderNodeTexCoord")
    onda = nt.nodes.new("ShaderNodeTexWave")
    onda.wave_type = "BANDS"
    onda.bands_direction = "Z"
    onda.inputs["Scale"].default_value = 1200
    rampa = nt.nodes.new("ShaderNodeValToRGB")
    rampa.color_ramp.elements[0].color = (0.62, 0.6, 0.56, 1)
    rampa.color_ramp.elements[1].color = (0.95, 0.93, 0.89, 1)
    nt.links.new(coord.outputs["Object"], onda.inputs["Vector"])
    nt.links.new(onda.outputs["Fac"], rampa.inputs["Fac"])
    nt.links.new(rampa.outputs["Color"], p.inputs["Base Color"])
    p.inputs["Roughness"].default_value = 0.8
    return m


# --- Mesa de madera ---------------------------------------------------------------------------------------
def mesa():
    bpy.ops.mesh.primitive_plane_add(size=3.0, location=(0, 0, 0))
    o = bpy.context.object
    m = bpy.data.materials.new("Madera")
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes["Principled BSDF"]
    coord = nt.nodes.new("ShaderNodeTexCoord")
    mapa = nt.nodes.new("ShaderNodeMapping")
    mapa.inputs["Scale"].default_value = (4.1, 4.1, 1)
    mapa.inputs["Rotation"].default_value = (0, 0, math.radians(90))
    nt.links.new(coord.outputs["UV"], mapa.inputs["Vector"])
    for clave, entrada, color in [("diff", "Base Color", True), ("rough", "Roughness", False)]:
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = imagen(os.path.join(PBR, f"wood_{clave}_2k.jpg"), color)
        nt.links.new(mapa.outputs["Vector"], t.inputs["Vector"])
        nt.links.new(t.outputs["Color"], p.inputs[entrada])
    tn = nt.nodes.new("ShaderNodeTexImage")
    tn.image = imagen(os.path.join(PBR, "wood_nor_gl_2k.jpg"), False)
    nt.links.new(mapa.outputs["Vector"], tn.inputs["Vector"])
    nm = nt.nodes.new("ShaderNodeNormalMap")
    nt.links.new(tn.outputs["Color"], nm.inputs["Color"])
    nt.links.new(nm.outputs["Normal"], p.inputs["Normal"])
    o.data.materials.append(m)


# --- Cartas: 63×88 mm, esquinas de 3 mm ---------------------------------------------------------------------
canto = None
dorso = None


def carta(nombre, frente, x, y, giro, z=0.0, boca_abajo=False, grosor=0.00035, canto_material=None):
    global canto, dorso
    canto = canto or material_liso("Canto", (0.92, 0.9, 0.86), 0.7)
    dorso = dorso or material_imagen("Dorso", os.path.join(TEX, "dorso.png"))
    w, h, r, t = 0.063, 0.088, 0.003, grosor
    contorno = []
    for cx, cy, a0 in [(w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180), (w / 2 - r, -h / 2 + r, 270)]:
        for k in range(9):
            a = math.radians(a0 + k * 90 / 8)
            contorno.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    malla = bpy.data.meshes.new(nombre)
    bm = bmesh.new()
    abajo = [bm.verts.new((px, py, -t / 2)) for px, py in contorno]
    arriba = [bm.verts.new((px, py, t / 2)) for px, py in contorno]
    cara_abajo = bm.faces.new(list(reversed(abajo)))
    cara_arriba = bm.faces.new(arriba)
    for i in range(len(contorno)):
        j = (i + 1) % len(contorno)
        bm.faces.new([abajo[i], abajo[j], arriba[j], arriba[i]]).material_index = 2
    cara_arriba.material_index = 0
    cara_abajo.material_index = 1
    uv = bm.loops.layers.uv.new()
    for f in (cara_arriba, cara_abajo):
        for l in f.loops:
            u = (l.vert.co.x + w / 2) / w
            v = (l.vert.co.y + h / 2) / h
            l[uv].uv = (u if f is cara_arriba else 1 - u, v)
    bm.to_mesh(malla)
    bm.free()
    o = bpy.data.objects.new(nombre, malla)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(material_imagen(f"Frente {frente}", os.path.join(TEX, f"{frente}.png")))
    o.data.materials.append(dorso)
    o.data.materials.append(canto_material or canto)
    o.location = (x, y, z + t / 2 + 0.0001)
    o.rotation_euler = (0, math.pi if boca_abajo else 0, math.radians(giro))
    return o


# --- Dados: 16 mm, aristas redondeadas y puntos hundidos ------------------------------------------------------
PUNTOS = {
    1: [(0, 0)],
    2: [(-1, -1), (1, 1)],
    3: [(-1, -1), (0, 0), (1, 1)],
    4: [(-1, -1), (1, -1), (-1, 1), (1, 1)],
    5: [(-1, -1), (1, -1), (0, 0), (-1, 1), (1, 1)],
    6: [(-1, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (1, 1)],
}
blanco = None
negro = None


def dado(nombre, arriba, x, y, giro, z=0.0):
    global blanco, negro
    blanco = blanco or material_liso("Dado", (0.93, 0.92, 0.9), 0.25, ss=0.15)
    negro = negro or material_liso("Punto", (0.02, 0.02, 0.025), 0.35)
    lado = 0.016
    bpy.ops.mesh.primitive_cube_add(size=lado, location=(0, 0, 0))
    d = bpy.context.object
    d.name = nombre
    d.data.materials.append(blanco)
    resto = [v for v in range(1, 7) if v not in (arriba, 7 - arriba)]
    caras = {(0, 0, 1): arriba, (0, 0, -1): 7 - arriba, (1, 0, 0): resto[0], (-1, 0, 0): 7 - resto[0]}
    otra = [v for v in resto if v not in (resto[0], 7 - resto[0])][0]
    caras[(0, 1, 0)] = otra
    caras[(0, -1, 0)] = 7 - otra
    esferas = []
    paso = lado * 0.27
    for normal, valor in caras.items():
        n = Vector(normal)
        a = Vector((1, 0, 0)) if abs(n.x) < 0.5 else Vector((0, 1, 0))
        b = n.cross(a)
        for i, j in PUNTOS[valor]:
            centro = n * (lado / 2 + 0.0006) + a * i * paso + b * j * paso
            bpy.ops.mesh.primitive_uv_sphere_add(radius=0.0017, location=centro, segments=24, ring_count=12)
            esferas.append(bpy.context.object)
    bpy.ops.object.select_all(action="DESELECT")
    for e in esferas:
        e.select_set(True)
    bpy.context.view_layer.objects.active = esferas[0]
    bpy.ops.object.join()
    cortador = bpy.context.object
    cortador.data.materials.append(negro)
    cortador.hide_render = True
    cortador.display_type = "WIRE"
    # Se mueve con el dado (los dos están ahora en el origen).
    cortador.parent = d
    bisel = d.modifiers.new("Bisel", "BEVEL")
    bisel.width = 0.0024
    bisel.segments = 6
    corte = d.modifiers.new("Puntos", "BOOLEAN")
    corte.operation = "DIFFERENCE"
    corte.object = cortador
    corte.solver = "EXACT"
    corte.material_mode = "TRANSFER"
    d.modifiers.new("Suave", "WEIGHTED_NORMAL")
    d.location = (x, y, z + lado / 2)
    d.rotation_euler = (0, 0, math.radians(giro))
    bpy.ops.object.select_all(action="DESELECT")
    d.select_set(True)
    bpy.context.view_layer.objects.active = d
    bpy.ops.object.shade_smooth()
    return d


# --- Fichas --------------------------------------------------------------------------------------------------
oro = None


def ficha(x, y, z=0.0):
    global oro
    oro = oro or material_liso("Ficha", (1.0, 0.45, 0.0), 0.28)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.0095, depth=0.003, vertices=48, location=(x, y, z + 0.0015))
    f = bpy.context.object
    f.data.materials.append(oro)
    b = f.modifiers.new("Bisel", "BEVEL")
    b.width = 0.0008
    b.segments = 4
    bpy.ops.object.shade_smooth()


# --- Cámara ----------------------------------------------------------------------------------------------------
def camara(posicion, objetivo, lente, foco, diafragma):
    bpy.ops.object.camera_add(location=posicion)
    cam = bpy.context.object
    cam.rotation_euler = (Vector(objetivo) - cam.location).to_track_quat("-Z", "Y").to_euler()
    cam.data.lens = lente
    cam.data.dof.use_dof = True
    cam.data.dof.focus_distance = (Vector(foco) - cam.location).length
    cam.data.dof.aperture_fstop = diafragma
    escena.camera = cam


def plantilla(fid):
    return [f for f in MUNDO["franquicias"] if f["id"] == fid][0]["plantilla"]


# =============================================================================================================
# Escenas
# =============================================================================================================


def partida_en_mesa():
    """Vendaval contra Búhos: las de cada uno en pista, las elecciones reveladas, los dados y el suplente."""
    carta("Nia", "J11", -0.072, -0.135, 7)
    carta("Dalia", "J08", 0.0, -0.140, -1)
    carta("Marta", "J10", 0.073, -0.133, -8)
    for fx, fy in [(-0.086, -0.196), (-0.064, -0.199), (0.0, -0.202), (0.064, -0.196), (0.086, -0.2)]:
        ficha(fx, fy)
    carta("Fuera", "fuera", -0.042, -0.025, 9)
    carta("Suplente", "dorso", 0.058, -0.022, -6, boca_abajo=True)
    dado("Dado1", 5, -0.014, 0.05, 22)
    dado("Dado2", 6, 0.017, 0.044, -14)
    carta("Dentro", "dentro", 0.032, 0.118, 194)
    carta("Iker", "J35", -0.074, 0.212, 178)
    carta("Ximena", "J37", 0.0, 0.218, 183)
    carta("Carlos", "J48", 0.074, 0.21, 176)


def mesa_story():
    resolucion(1080, 1920)
    luz()
    mesa()
    partida_en_mesa()
    camara((0.02, -0.28, 0.47), (0.0, 0.005, 0), 40, (0, -0.06, 0), 3.2)


def mesa_publicacion():
    resolucion(1080, 1350)
    luz()
    mesa()
    partida_en_mesa()
    camara((0.02, -0.275, 0.38), (0.0, -0.012, 0), 42, (0, -0.06, 0), 3.2)


def web():
    """Panorámica para la web: la misma partida vista de lado, muy baja, con mucho desenfoque."""
    resolucion(2400, 1000)
    luz()
    mesa()
    partida_en_mesa()
    camara((-0.31, -0.22, 0.21), (0.0, 0.02, 0.0), 50, (-0.014, 0.05, 0.008), 2.0)


def presentamos(jid):
    """La carta de un jugador en primer plano; detrás, sus compañeros y unos dados, desenfocados."""
    resolucion(1080, 1350)
    luz()
    mesa()
    fid = MUNDO["jugadores"][jid]["franquicia"]
    otros = [x for x in plantilla(fid) if x != jid]
    carta("Protagonista", jid, 0.0, 0.0, -5)
    for k, (ox, oy, g) in enumerate([(-0.085, 0.11, 9), (0.0, 0.135, -3), (0.085, 0.115, -11)]):
        carta(f"Compañero{k}", otros[k], ox, oy, g)
    dado("Dado1", 6, 0.06, -0.055, 18)
    dado("Dado2", 3, 0.083, -0.04, -9)
    ficha(-0.055, -0.065)
    ficha(-0.036, -0.074)
    camara((0.0, -0.11, 0.2), (0.0, 0.012, 0.0), 58, (0.0, 0.004, 0.0), 6.0)


def navidad():
    """Las estrellas de los dos equipos del primer amistoso, cara a cara, con luces de Navidad detrás."""
    resolucion(1080, 1350)
    luz(fuerza_hdri=0.12, ventana=10, color=(1.0, 0.82, 0.62))
    mesa()
    carta("Local", "J11", -0.036, 0.0, 11)
    carta("Visitante", "J35", 0.036, 0.004, -12, z=0.0006)
    dado("Dado1", 4, -0.012, 0.075, 25)
    dado("Dado2", 6, 0.016, 0.07, -10)
    for fx, fy in [(-0.082, 0.05), (-0.064, 0.058), (0.078, 0.055)]:
        ficha(fx, fy)
    # Una guirnalda de bombillas al fondo: con el desenfoque, círculos de luz.
    colores = [(1.0, 0.65, 0.25), (1.0, 0.35, 0.2), (1.0, 0.82, 0.45), (0.35, 0.8, 0.45)]
    for k in range(17):
        a = k / 16
        x = -0.48 + 0.96 * a
        y = 0.8 + 0.1 * math.sin(a * 7.3)
        z = 0.075 + 0.04 * math.sin(a * 11.1 + 1.0)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.004, location=(x, y, z), segments=16, ring_count=8)
        bpy.context.object.data.materials.append(material_liso(f"Bombilla{k}", colores[k % 4], 0.3, emision=40))
    camara((0.0, -0.21, 0.1), (0.0, 0.02, 0.018), 50, (0.0, -0.02, 0.0), 5.0)


def mazo():
    """Una estrella de cada franquicia, en abanico; al lado, el mazo con los dados encima."""
    resolucion(1080, 1350)
    luz()
    mesa()
    estrellas = []
    for f in MUNDO["franquicias"]:
        ids = sorted(f["plantilla"], key=lambda j: -(MUNDO["jugadores"][j]["ataque"] * 10 + MUNDO["jugadores"][j]["defensa"]))
        estrellas.append(ids[0])
    centro = Vector((0.0, -0.055, 0))
    for k, jid in enumerate(estrellas):
        a = math.radians(-56 + 106 * k / (len(estrellas) - 1))
        pos = centro + Vector((math.sin(a), math.cos(a), 0)) * 0.05
        carta(f"Abanico{k}", jid, pos.x, pos.y, -math.degrees(a), z=k * 0.00045)
    carta("Mazo", "dorso", -0.085, 0.085, 8, boca_abajo=True, grosor=0.012, canto_material=material_canto_mazo())
    dado("Dado1", 5, -0.092, 0.08, 18, z=0.012)
    dado("Dado2", 2, 0.07, 0.06, -20)
    camara((0.0, -0.2, 0.27), (0.0, 0.0, 0), 44, (0.02, -0.02, 0.0), 3.5)


ESCENAS = {"mesa-story": mesa_story, "mesa-publicacion": mesa_publicacion, "web": web, "navidad": navidad, "mazo": mazo}
if nombre_escena.startswith("presentamos-"):
    presentamos(nombre_escena.split("-", 1)[1])
else:
    ESCENAS[nombre_escena]()
bpy.ops.render.render(write_still=True)
