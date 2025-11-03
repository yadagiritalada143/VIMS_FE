import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { LangSwitcherComponent } from './lang-switcher.component';
import { FilterPipe } from '../../components/filter/filter';
import { CommonModule } from '@angular/common';
import { CommonTestingModule } from 'src/testing/commontest.module';
describe('LangSwitcherComponent', () => {
  let component: LangSwitcherComponent;
  let fixture: ComponentFixture<LangSwitcherComponent>;
  CommonTestingModule.setUpTestBed(LangSwitcherComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      //workaround to get pass errors in testing
      imports: [
        CommonModule
      ],
      declarations: [LangSwitcherComponent, FilterPipe]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LangSwitcherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
