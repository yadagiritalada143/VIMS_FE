import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { AsidePanelComponent } from './aside-panel.component';

describe('AsidePanelComponent', () => {
  let component: AsidePanelComponent;
  let fixture: ComponentFixture<AsidePanelComponent>;
  CommonTestingModule.setUpTestBed(AsidePanelComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AsidePanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AsidePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
