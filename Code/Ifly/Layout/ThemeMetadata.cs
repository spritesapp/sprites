using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Text.RegularExpressions;
using System.Web;

using ExCSS;
using ExCSS.Model;
using ExCSS.Model.Extensions;

namespace Ifly.Layout
{
    /// <summary>
    /// Represents theme metadata.
    /// </summary>
    public class ThemeMetadata
    {
        /// <summary>
        /// Represents ExCSS stylesheet wrapper.
        /// </summary>
        public class ExCSSStylesheet
        {
            private readonly StyleSheet _stylesheet;
            private readonly string _id;

            /// <summary>
            /// Gets or sets the selected font.
            /// </summary>
            public string FontFamily
            {
                get { return QueryFontFamily(); }
                set { QueryFontFamily(value); }
            }

            /// <summary>
            /// Gets or sets selected font color.
            /// </summary>
            public string FontColor
            {
                get { return QueryFontColor(); }
                set { QueryFontColor(value); }
            }

            /// <summary>
            /// Gets or sets the accent color #1.
            /// </summary>
            public string AccentColor1
            {
                get { return QueryAccentColor1(); }
                set { QueryAccentColor1(value); }
            }

            /// <summary>
            /// Gets or sets the accent color #2.
            /// </summary>
            public string AccentColor2
            {
                get { return QueryAccentColor2(); }
                set { QueryAccentColor2(value); }
            }

            /// <summary>
            /// Gets or sets the accent color #3.
            /// </summary>
            public string AccentColor3
            {
                get { return QueryAccentColor3(); }
                set { QueryAccentColor3(value); }
            }

            /// <summary>
            /// Gets or sets the accent color #4.
            /// </summary>
            public string AccentColor4
            {
                get { return QueryAccentColor4(); }
                set { QueryAccentColor4(value); }
            }

            /// <summary>
            /// Gets or sets the background color.
            /// </summary>
            public string BackgroundColor
            {
                get { return QueryBackgroundColor(); }
                set { QueryBackgroundColor(value); }
            }

            /// <summary>
            /// Gets or sets background image.
            /// </summary>
            public string BackgroundImage
            {
                get { return QueryBackgroundImage(); }
                set { QueryBackgroundImage(value); }
            }

            /// <summary>
            /// Gets or sets the logo.
            /// </summary>
            public string Logo
            {
                get { return QueryLogo(); }
                set { QueryLogo(value); }
            }

            /// <summary>
            /// Initializes a new instance of an object.
            /// </summary>
            /// <param name="id">Theme Id.</param>
            /// <param name="css">Theme CSS.</param>
            public ExCSSStylesheet(string id, string css)
            {
                _id = id;
                _stylesheet = new Parser().Parse(css);
            }

            /// <summary>
            /// Returns string representation of the current object.
            /// </summary>
            /// <returns>String representation of the current object.</returns>
            public override string ToString()
            {
                return _stylesheet.ToString(true, 2);
            }

            /// <summary>
            /// Gets or sets font family.
            /// </summary>
            /// <param name="value">New value.</param>
            /// <returns>Value.</returns>
            private string QueryFontFamily(string value = null)
            {
                int trimIndex = -1;
                Property prop = null;
                StyleRule rule = null;
                string ret = string.Empty;
                ImportRule fontImport = null;

                rule = _stylesheet.Rules.OfType<StyleRule>()
                    .Where(r => string.Compare(r.Selector.ToString(), string.Concat(".theme-", _id), true) == 0)
                    .FirstOrDefault();

                if (rule != null)
                {
                    prop = rule.Declarations.Where(d => string.Compare(d.Name, "font-family", true) == 0)
                        .FirstOrDefault();

                    if (prop != null)
                    {
                        // Removing everyting except of the font name itself (assuming sans-serif).

                        ret = value != null ? value : prop.Term.ToString();
                        trimIndex = ret.IndexOf('\'');

                        if (trimIndex < 0)
                            trimIndex = ret.IndexOf(' ');

                        if (trimIndex > 0)
                            ret = ret.Substring(0, trimIndex).Trim('\'').Trim();

                        if (value != null)
                        {
                            rule.Declarations.Add(NewProperty("font-family", string.Format("'{0}', sans-serif", value)));

                            _stylesheet.Rules.OfType<ImportRule>().ToList().ForEach(ir => {
                                if (ir.Href.ToLowerInvariant().IndexOf("fonts.googleapis.com") >= 0)
                                    _stylesheet.Rules.Remove(ir);
                            });

                            fontImport = new ImportRule();
                            fontImport.RuleType = RuleType.Import;
                            fontImport.Href = string.Format("http://fonts.googleapis.com/css?family={0}", HttpUtility.UrlEncode(value));

                            _stylesheet.Rules.Add(fontImport);
                        }
                    }
                }

                return ret;
            }

            /// <summary>
            /// Gets or sets font color.
            /// </summary>
            /// <param name="value">New value.</param>
            /// <param name="index">Color index.</param>
            /// <returns>Value.</returns>
            private string QueryFontColor(string value = null)
            {
                Property prop = null;
                StyleRule rule = null;
                string ret = string.Empty;

                rule = _stylesheet.Rules.OfType<StyleRule>()
                    .Where(r => string.Compare(r.Selector.ToString(), string.Concat(".theme-", _id), true) == 0)
                    .FirstOrDefault();

                if (rule != null)
                {
                    prop = rule.Declarations.Where(d => string.Compare(d.Name, "color", true) == 0)
                        .FirstOrDefault();

                    if (prop != null)
                        ret = prop.Term.ToString();

                    if (value != null)
                    {
                        ret = value;
                        rule.Declarations.Add(NewProperty("color", value));
                    }
                }

                return ret;
            } 

            /// <summary>
            /// Gets or sets accent color 1.
            /// </summary>
            /// <param name="value">New value.</param>
            /// <param name="index">Color index.</param>
            /// <returns>Value.</returns>
            private string QueryAccentColor(string value, int index)
            {
                Property prop = null;
                StyleRule rule = null;
                string ret = string.Empty;

                rule = _stylesheet.Rules.OfType<StyleRule>()
                    .Where(r => string.Compare(r.Selector.ToString(), string.Concat(".theme-", _id, " .accent-", index.ToString()), true) == 0)
                    .FirstOrDefault();

                if (rule != null)
                {
                    prop = rule.Declarations.Where(d => string.Compare(d.Name, "color", true) == 0)
                        .FirstOrDefault();

                    if (prop != null)
                        ret = prop.Term.ToString();

                    if (value != null && !string.IsNullOrEmpty(ret))
                    {
                        foreach (var r in _stylesheet.Rules.OfType<StyleRule>())
                        {
                            foreach (var d in r.Declarations)
                            {
                                if (d.Term.ToString().IndexOf(ret, StringComparison.OrdinalIgnoreCase) >= 0)
                                    d.Term = new PrimitiveTerm(UnitType.Unknown, Regex.Replace(d.Term.ToString(), ret, value, RegexOptions.IgnoreCase));
                            }
                        }

                        ret = value;
                    }
                }

                return ret;
            } 

            /// <summary>
            /// Gets or sets accent color 1.
            /// </summary>
            /// <param name="value">New value.</param>
            /// <returns>Value.</returns>
            private string QueryAccentColor1(string value = null)
            {
                return QueryAccentColor(value, 1);
            }

            /// <summary>
            /// Gets or sets accent color 2.
            /// </summary>
            /// <param name="value">New value.</param>
            /// <returns>Value.</returns>
            private string QueryAccentColor2(string value = null)
            {
                return QueryAccentColor(value, 2);
            }

            /// <summary>
            /// Gets or sets accent color 3.
            /// </summary>
            /// <param name="value">New value.</param>
            /// <returns>Value.</returns>
            private string QueryAccentColor3(string value = null)
            {
                return QueryAccentColor(value, 3);
            }

            /// <summary>
            /// Gets or sets accent color 4.
            /// </summary>
            /// <param name="value">New value.</param>
            /// <returns>Value.</returns>
            private string QueryAccentColor4(string value = null)
            {
                return QueryAccentColor(value, 4);
            }

            /// <summary>
            /// Gets or sets background color.
            /// </summary>
            /// <param name="value">New value.</param>
            /// <returns>Value.</returns>
            private string QueryBackgroundColor(string value = null)
            {
                Property prop = null;
                StyleRule rule = null;
                string ret = string.Empty;

                rule = _stylesheet.Rules.OfType<StyleRule>()
                    .Where(r => string.Compare(r.Selector.ToString(), string.Concat(".theme-", _id), true) == 0)
                    .FirstOrDefault();

                if (rule != null)
                {
                    prop = rule.Declarations.Where(d => string.Compare(d.Name, "background-color", true) == 0)
                        .FirstOrDefault();

                    if (prop != null)
                        ret = prop.Term.ToString();

                    if (value != null)
                    {
                        ret = value;
                        rule.Declarations.Add(NewProperty("background-color", value));
                    }
                }

                return ret;
            }

            /// <summary>
            /// Gets or sets background image.
            /// </summary>
            /// <param name="value">New value.</param>
            /// <returns>Value.</returns>
            private string QueryBackgroundImage(string value = null)
            {
                return QueryBackgroundImage(".background-image", true, value);
            }

            /// <summary>
            /// Gets or sets logo.
            /// </summary>
            /// <param name="value">New value.</param>
            /// <returns>Value.</returns>
            private string QueryLogo(string value = null)
            {
                return QueryBackgroundImage(".company-logo", false, value);
            }

            /// <summary>
            /// Gets or sets logo.
            /// </summary>
            /// <param name="cssClass">CSS class.</param>
            /// <param name="value">New value.</param>
            /// <returns>Value.</returns>
            private string QueryBackgroundImage(string cssClass, bool addThemeRule, string value = null)
            {
                Property prop = null;
                StyleRule rule = null;
                string selector = null;
                string ret = string.Empty;
                StyleDeclaration declaration = null;
                
                rule = _stylesheet.Rules.OfType<StyleRule>()
                    .Where(r => r.Selector.ToString().IndexOf(string.Concat(".theme-", _id, " ", cssClass), StringComparison.OrdinalIgnoreCase) >= 0)
                    .FirstOrDefault();

                if (rule != null)
                {
                    prop = rule.Declarations.Where(d => string.Compare(d.Name, "background-image", true) == 0)
                        .FirstOrDefault();

                    if (prop != null)
                    {
                        ret = Regex.Match(
                            prop.Term.ToString(),
                            @"url\s*\(([^\)]+)\)",
                            RegexOptions.IgnoreCase
                        ).Groups[1].Value.Trim('\'', '"').Trim();

                        if (value != null)
                        {
                            ret = value;
                            rule.Declarations.Add(NewProperty("background-image", string.Format("url('{0}')", value)));
                        }
                    }
                }
                else if (value != null)
                {
                    selector = string.Concat(".theme-", _id, " ", cssClass);

                    if (addThemeRule)
                        selector += string.Concat(", .theme-", _id, cssClass);

                    declaration = new StyleDeclaration();
                    rule = new StyleRule(declaration);

                    rule.Selector = new SimpleSelector(selector);
                    rule.Declarations.Add(NewProperty("background-image", value.Length > 0 ? string.Format("url('{0}')", value) : "none"));

                    _stylesheet.Rules.Add(rule);
                }

                return ret;
            }

            /// <summary>
            /// Creates new CSS property.
            /// </summary>
            /// <param name="name">Property name.</param>
            /// <param name="value">Property value.</param>
            /// <returns>Property.</returns>
            private Property NewProperty(string name, string value)
            {
                var ret = new Property(name);

                ret.Term = new PrimitiveTerm(UnitType.Unknown, value);

                return ret;
            }
        }

        /// <summary>
        /// Gets or sets the selected font.
        /// </summary>
        public string FontFamily { get; set; }

        /// <summary>
        /// Gets or sets the selected font color.
        /// </summary>
        public string FontColor { get; set; }

        /// <summary>
        /// Gets or sets the accent color #1.
        /// </summary>
        public string AccentColor1 { get; set; }

        /// <summary>
        /// Gets or sets the accent color #2.
        /// </summary>
        public string AccentColor2 { get; set; }

        /// <summary>
        /// Gets or sets the accent color #3.
        /// </summary>
        public string AccentColor3 { get; set; }

        /// <summary>
        /// Gets or sets the accent color #4.
        /// </summary>
        public string AccentColor4 { get; set; }

        /// <summary>
        /// Gets or sets the background color.
        /// </summary>
        public string BackgroundColor { get; set; }

        /// <summary>
        /// Gets or sets background image.
        /// </summary>
        public string BackgroundImage { get; set; }

        /// <summary>
        /// Gets or sets the logo.
        /// </summary>
        public string Logo { get; set; } 

        /// <summary>
        /// Parses metadata from a given theme.
        /// </summary>
        /// <param name="id">Theme Id.</param>
        /// <returns>Theme parsed metadata.</returns>
        public static ThemeMetadata ParseMetadata(string id)
        {
            return ParseMetadata(id, ResolveThemeContents(id));
        }

        /// <summary>
        /// Resolves the CSS contents of a given theme.
        /// </summary>
        /// <param name="id">Theme Id.</param>
        /// <returns>Theme CSS contents.</returns>
        public static string ResolveThemeContents(string id)
        {
            string ret = string.Empty;
            int startIndex = -1, endIndex = -1;
            string themeCssClassName = string.Concat(".theme-", id);
            UserTheme theme = UserThemeSource.Current.GetImportedThemes().Themes
                .Where(t => string.Compare(t.Id, id, true) == 0)
                .FirstOrDefault();

            if (theme != null && System.IO.File.Exists(theme.PhysicalPath))
                ret = System.IO.File.ReadAllText(theme.PhysicalPath);
            else if (HttpContext.Current != null)
            {
                ret = System.IO.File.ReadAllText(HttpContext.Current.Server.MapPath("~/Assets/css/Embed/Themes.css"));

                startIndex = ret.IndexOf(themeCssClassName, StringComparison.OrdinalIgnoreCase);

                if (startIndex >= 0)
                {
                    endIndex = ret.LastIndexOf(themeCssClassName, StringComparison.OrdinalIgnoreCase);

                    if (endIndex >= 0 && endIndex > startIndex)
                    {
                        endIndex = ret.IndexOf('}', endIndex);

                        if (endIndex >= 0)
                            ret = ret.Substring(startIndex, endIndex - startIndex + 1);
                    }
                }
            }

            return ret;
        }

        /// <summary>
        /// Tries to re-map theme background image for a iven presentation.
        /// </summary>
        /// <param name="p">Presentation.</param>
        /// <returns>Presentation.</returns>
        public static Presentation TryRemapThemeBackgroundImage(Presentation p)
        {
            ThemeMetadata metadata = null;

            if (p != null && string.IsNullOrWhiteSpace(p.BackgroundImage))
            {
                metadata = ThemeMetadata.ParseMetadata(p.Theme);

                // We have a nice rendering for background image on the front-end. We don't want to duplicate this functionality but we'd rather put theme BG image as user-specified one.
                if (metadata != null)
                    p.BackgroundImage = metadata.BackgroundImage;
            }

            return p;
        }

        /// <summary>
        /// Parses metadata from a given CSS text.
        /// </summary>
        /// <param name="id">Theme Id.</param>
        /// <param name="css">Theme CSS.</param>
        /// <returns>Theme parsed metadata.</returns>
        public static ThemeMetadata ParseMetadata(string id, string css)
        {
            ExCSSStylesheet stylesheet = null;
            ThemeMetadata ret = new ThemeMetadata();

            if (!string.IsNullOrEmpty(css) && !string.IsNullOrEmpty(id))
            {
                stylesheet = new ExCSSStylesheet(id, css);

                ret.FontFamily = stylesheet.FontFamily;
                ret.FontColor = stylesheet.FontColor;
                ret.AccentColor1 = stylesheet.AccentColor1;
                ret.AccentColor2 = stylesheet.AccentColor2;
                ret.AccentColor3 = stylesheet.AccentColor3;
                ret.AccentColor4 = stylesheet.AccentColor4;
                ret.BackgroundColor = stylesheet.BackgroundColor;
                ret.BackgroundImage = stylesheet.BackgroundImage;
                ret.Logo = stylesheet.Logo;
            }

            return ret;
        }
    }
}
